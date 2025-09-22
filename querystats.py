import sys
import os
from collections import defaultdict
from collections import OrderedDict
import json
import random
import time
import re
import pprint
import string
import urllib
import copy
import uuid
from bson.objectid import ObjectId
from bson.decimal128 import Decimal128
from decimal import Decimal
from bbutil import Util
import datetime
import pymongo
from pymongo import MongoClient
from pymongo.errors import BulkWriteError
from pymongo import UpdateOne
from pymongo import UpdateMany

settings_file = "settings.json"
storage_file = "last_run.txt"

#----------------------------------------------------------------------#
#   MAIN Routines
#----------------------------------------------------------------------#

def query_stats():
    source_conn, db_source = client_connection("source")  
    conn, db_logger = client_connection("logger")
    ts = datetime.datetime.now()
    coll = settings["database"]["logger"]["collection"]
    collection = db_logger[coll]
    cur_run_id = generate_run_id()
    result = list(execute_command(db_source))
    n = 0
    bulk_arr = []
    for item in result:
        #pprint.pprint(item)
        item["run_timestamp"] = ts
        item["run_id"] = cur_run_id
        item["doc_type"] = "raw"
        bulk_arr.append(item)
        n += 1
    collection.insert_many(bulk_arr)
    print(f"Saved {n} records, run_id: {cur_run_id}")
    if "seed" not in ARGS:
        previous_data = load_previous_data(collection)
        differences = compare_results(result, previous_data)
        if len(differences) > 0:
            collection.insert_many(differences)
    update_run_id(cur_run_id, ts, db_logger)
    source_conn.close()
    conn.close()
    return result

def query_stats_feed():
    # Generates stats on a timer
    # First time generate stats twice for difference
    query_stats()
    time.sleep(2)
    print("Performing 100 iterations, sleeping 5 minutes between each")
    for k in range(100):
        query_stats()
        print(f"Sleeping for 5 minutes, {k} of 100")
        time.sleep(5*60)
        

def load_previous_data(coll):
    """Load previous queryStats data from storage file"""
    cur_id = ""
    result = ""
    if os.path.exists(storage_file):
        try:
            with open(storage_file, 'r') as f:
                cur_id = f.read()
        except IOError as e:
            print(f"Warning: Could not load previous data: {e}")
            return ""
        result = list(coll.find({"run_id" : cur_id.strip()}))
        print(f'Finding previous run_id: {cur_id}')
        print(f'Found {len(result)} records')
    return result

def update_run_id(run_id, run_time, db):
    """Save previous queryStats data to storage file"""
    if os.path.exists(storage_file):
        try:
            with open(storage_file, 'w') as f:
                f.write(run_id)
        except IOError as e:
            print(f"Warning: Could not write to file: {e}")
            return False
    db["run_ids"].insert_one({"run_id" : run_id, "timestamp": run_time})
    return True

def lookup_hash(query_hash, data):
    for item in data:
        if item["queryShapeHash"] == query_hash:
            return item
    return None

def calculate_diff(current, previous):
    diff = {}
    for key in current:
        if key in previous:
            if isinstance(current[key], dict) and "sum" in current[key]:
                diff[key] = {}
                for field in ["sum", "sumOfSquares"]:
                    if field == "sumOfSquares":
                        diff[key][field] = int(current[key][field].to_decimal()) - int(previous[key][field].to_decimal())
                    else:
                        diff[key][field] = current[key][field] - previous[key][field]
                diff[key]["max"] = current[key]["max"]
                diff[key]["min"] = current[key]["min"]
            elif isinstance(current[key], dict) and "true" in current[key]:
                diff[key] = {}
                for field in ["true", "false"]:
                    diff[key][field] = current[key][field] - previous[key][field]
            elif(key in ["firstSeenTimestamp", "latestSeenTimestamp"]):
                diff[key] = current[key]
            else:
                diff[key] = current[key] - previous[key]
        else:
            diff[key] = current[key]
    return diff

def compare_results(current_data, previous_data):
    """
    Calculate differences between current and previous queryStats    
    Args:
        current_querystats: List of current queryStats entries        
    Returns:
        Dictionary containing differences and metadata
    """
    timestamp = datetime.datetime.now().isoformat()
    diff = ""
    diff_docs = []
    print("# -------------------------------------------------------------------------- #")
    print(f'# ----- FROM: {previous_data[0]["run_timestamp"]} TO: {current_data[0]["run_timestamp"]} ----- #')
    for item in current_data:
        query_hash = item.get('queryShapeHash', '')
        cur_db = item["key"]["queryShape"]["cmdNs"]["db"]
        if cur_db != settings["match_database"]:
            print(f"DB: {cur_db} - skipping")
            continue
        elif settings["match_driver"] not in item["key"]["client"]["driver"]["name"]:
            continue
        else:
            driver = item["key"]["client"]["driver"]["name"]
            match_item = lookup_hash(query_hash, previous_data)
            cmd_type = item["key"]["queryShape"]["command"]
            if match_item:
                print(f"Matching: {query_hash} - found")
                diff = calculate_diff(item["metrics"], match_item["metrics"])
                print(f'DB: {cur_db}, Collection: {item["key"]["queryShape"]["cmdNs"]["coll"]}')
                print(f'From: {driver} on {item["key"]["client"]["os"]["type"]}')
                print(f'Type: {cmd_type}')
                pretty_query = ""
                if cmd_type == "aggregate":
                    pretty_query = pprint.pformat(item["key"]["queryShape"]["pipeline"])
                else:
                    pretty_query = pprint.pformat(item["key"]["queryShape"]["filter"])
                print(pretty_query)
                print(f"# ---------------------------- Diff ---------------------------- #")
                pprint.pprint(diff)
                print(f"# ---------------------------- Previous ---------------------------- #")
                pprint.pprint(match_item["metrics"])
                print(f"# ---------------------------- Current ---------------------------- #")
                pprint.pprint(item["metrics"])
                diff_doc = {
                    "queryShapeHash": query_hash,
                    "namespace": item["key"]["queryShape"]["cmdNs"]["db"] + "." + item["key"]["queryShape"]["cmdNs"]["coll"],
                    "client": f'{driver} on {item["key"]["client"]["os"]["type"]}',
                    "command": cmd_type,
                    "query": pretty_query,
                    "start_timestamp": match_item["run_timestamp"],
                    "end_timestamp": item["run_timestamp"],
                    "run_id": item["run_id"],
                    "metrics": diff,
                    "doc_type": "result"
                    
                }
                diff_docs.append(diff_doc)
            else:
                print(f"Matching: {query_hash} - not found")
    
    return diff_docs

def generate_run_id():
    # Generate two random uppercase letters
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    ts = datetime.datetime.now()
    fts = ts.strftime("%Y%m%d-%M")
    return f"{fts}{letters}"

def generate_report(run_id):
    """Generate a report of the queryStats results"""
    run_id = '20250909-52ZS'
    pipe = [
        {
            '$match': {
                'doc_type': 'result', 
                'run_id': run_id
            }
        }, {
            '$project': {
                'exec_time': {
                    '$multiply': [
                        '$metrics.totalExecMicros.sum', 0.000001
                    ]
                }, 
                'num': '$metrics.execCount', 
                'namespace': 1, 
                'client': 1, 
                'query': 1
            }
        }, {
            '$sort': {
                'exec_time': -1
            }
        },
        {
            '$limit': 10
        }
    ]
    conn, db = client_connection("logger")
    ts = datetime.datetime.now()
    collection = settings["database"]["logger"]["collection"]
    recs = collection.aggregate(pipe)
    for it in recs:
        pprint.pprint(it)
    conn.close()

#----------------------------------------------------------------------#
#   Utility Routines
#----------------------------------------------------------------------#
def execute_command(db):
    # gather stats from the admin db
    cmd = [{"$queryStats": {}}]
    result = db.aggregate(cmd)
    return result

def bulk_writer(collection, bulk_arr, msg = ""):
    try:
        result = collection.bulk_write(bulk_arr, ordered=False)
        ## result = db.test.bulk_write(bulkArr, ordered=False)
        # Opt for above if you want to proceed on all dictionaries to be updated, even though an error occured in between for one dict
        #pprint.pprint(result.bulk_api_result)
        note = f'BulkWrite - mod: {result.bulk_api_result["nModified"]} {msg}'
        #file_log(note,locker,hfile)
        print(note)
    except BulkWriteError as bwe:
        print("An exception occurred ::", bwe.details)

def client_connection(dtype = "uri", details = {}):
    lsettings = settings["database"]
    if dtype != "uri":
        lsettings = settings["database"][dtype]
    mdb_conn = lsettings["uri"]
    username = lsettings["username"]
    password = lsettings["password"]
    if "secret" in password:
        if "env_var" in lsettings:
            password = os.environ.get(lsettings["env_var"])
        else:
            password = os.environ.get("_PWD_")
    if "username" in details:
        username = details["username"]
        password = details["password"]
    try:
        if "%" not in password:
            password = urllib.parse.quote_plus(password)
    except Exception as e:
        print(f'Error: {e}')
        print("Set the password environment variable, e.g. _PWD_=yourpassword")
        exit(1)
    mdb_conn = mdb_conn.replace("//", f'//{username}:{password}@')
    bb.logit(f'Connecting: {mdb_conn}')
    if "readPreference" in details:
        client = MongoClient(mdb_conn, readPreference=details["readPreference"]) #&w=majority
    else:
        client = MongoClient(mdb_conn)
        db = client[lsettings["database"]]
    return client, db

#------------------------------------------------------------------#
#     MAIN
#------------------------------------------------------------------#
if __name__ == "__main__":
    bb = Util()
    ARGS = bb.process_args(sys.argv)
    settings = bb.read_json(settings_file)
    base_counter = settings["base_counter"]
    if "wait" in ARGS:
        interval = int(ARGS["wait"])
        if interval > 10:
            bb.logit(f'Delay start, waiting: {interval} seconds')
            time.sleep(interval)
    if "action" not in ARGS:
        print("Send action= argument")
        sys.exit(1)
    elif ARGS["action"] == "stats":
        query_stats()
    elif ARGS["action"] == "stats_feed":
        query_stats_feed()
    else:
        print(f'{ARGS["action"]} not found')
