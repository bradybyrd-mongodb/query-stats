# Gather and display queryStats data #

This script will gather queryStats data from a MongoDB cluster and display the differences between the current and previous run.  The data is stored in a MongoDB collection for later analysis.    

## Requirements ##

- Python 3.7 or later
- pip install -r requirements.txt
- A MongoDB cluster with queryStats enabled
- A MongoDB user with the clusterMonitor role

## Usage ##

Ideally, the script would be run from a cron job at regular intervals, or in a lambda with a timer.  The script can also be run manually.  The script will calculate the difference between the current and previous run.  The first run will not have a previous run to compare to, so the seed=yes option should be used to store the current stats without calculating a difference for thte first run in an empty collection.
The script can be invoked with the following command:
```bash
python querystats.py action=stats
```
or, to run 100 times at 5 minute intervals
```bash
python querystats.py action=stats_feed
```

For the first run add the seed=yes option to the command line. Each run will calculate the difference in the cumulative stats since the previous run.  The seed option bypasses that and just stores the current stats.
```bash
python querystats.py action=stats seed=yes
```

Most fo the parameters necessary for operation are in the settings.json file.  The following parameters can be overridden on the command line:
