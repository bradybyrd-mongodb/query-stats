# Gather and display queryStats data #

This script will gather queryStats data from a MongoDB cluster and display the differences between the current and previous run.  The data is stored in a MongoDB collection for later analysis.    

## Requirements ##

- Python 3.7 or later
- pip install -r requirements.txt
- A MongoDB cluster with queryStats enabled
- A MongoDB user with the clusterMonitor role

## Setup ##

1. Install Python 3.7 or later
2. pip install -r requirements.txt
3. Create a MongoDB user with the clusterMonitor role ("Source" database)
4. Update the settings.json file
    a. Update the database.source section with your MongoDB connection information for the cluster you want to monitor
    b. update the database.logger section with your MongoDB connection information for the cluster you want to store the results
    c. Update the match_namespace array in the settings.json file with the namespaces you want to monitor.  Namespaces are in the format "database.collection"
    d. Set the interval_seconds parameter to the number of seconds you want to wait between runs of the queryStats.py script
5. Source you python virtual environment e.g.
```bash
source venv/bin/activate
```
6. Set you password environment variables e.g.
```bash
export _SOURCEPWD_=yourpassword
export _PWD_=yourpassword
```

## Operation ##

Ideally, the script would be run from a cron job at regular intervals, or in a lambda with a timer.  The script can also be run manually.  The script will calculate the difference between the current and previous run.  The first run will not have a previous run to compare to, so the seed=yes option should be used to store the current stats without calculating a difference for thte first run in an empty collection.

1. The queryStats.py script is the main entry point.  It can be run manually, or from a cron job, or in a lambda with a timer.  Start with a test run to verify your configuration
```bash
python3 querystats.py action=stats_test
```
2. Next, run the script to gather the stats and store the seed results
```bash
python3 querystats.py action=stats seed=yes
```
3. Finally, run the script to gather the stats and store the results
```bash
python3 querystats.py action=stats_feed quiet=yes
```
4. The webapp is a simple React/Node.js web application insure that your npm install has been run.  See the webapp/README.md file for more information.
5. Start the webapp
```bash
cd webapp
npm run dev:all
```
6. Open your browser to http://localhost:3000


