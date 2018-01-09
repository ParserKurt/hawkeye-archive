#!/bin/bash
JQ=/usr/local/bin/jq
env="config/environment/development.json"

host=($(jq -r '.host' $env))
database=($(jq -r '.database' $env))
table=($(jq -r '.table' $env))
user=($(jq -r '.user' $env))
password=($(jq -r '.password' $env))
destHost=($(jq -r '.destHost' $env))
destDatabase=($(jq -r '.destDatabase' $env))
destUser=($(jq -r '.destUser' $env))
destPassword=($(jq -r '.destPassword' $env))
file=($(jq -r '.file' $env))
condition_archive=($(jq -r '.condition_archive' $env))
condition_purge=($(jq -r '.condition_purge' $env))
days_archive=($(jq -r '.days_archive' $env))
days_purge=($(jq -r '.days_purge' $env))
slave_lag=($(jq -r '.slave_lag' $env))


getArray() {
    array=() # Create array
    while IFS= read -r line # Read a line
    do
        array+=("$line") # Append line to the array
    done < "$1"
}

getArray "config/tables.txt"
for t in "${array[@]}"
    do
            #execute purge
            echo "executing data purging........"
            getArray "config/tables.txt"
            for t in "${array[@]}"
                do
            #         if [ $t = "api_user" ]
            #            then
            #                condition_purge="date_created < NOW() - INTERVAL 180 DAY"
            #            else
            #                condition_purge="timestamp < NOW() - INTERVAL 180 DAY"
            #         fi
                     condition_purge="timestamp <= NOW() - INTERVAL $days_purge DAY"
                     echo "purging $t"
                     eval pt-archiver --source h=$host,D=$database,t=$t,p=$password,u=$user --where "'$condition_purge'" --purge --limit 10000 --commit-each --no-check-charset --header --progress 1 --statistics --why-quit --retries 5
                done
            echo "done purging"

    done



