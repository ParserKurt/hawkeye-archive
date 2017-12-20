#!/bin/bash
JQ=/usr/local/bin/jq
env="config/environment/$1.json"

getArray() {
    array=() # Create array
    while IFS= read -r line # Read a line
    do
        array+=("$line") # Append line to the array
    done < "$1"
}


if [ $# -eq 0 ]
  then
    echo "please enter the environment for data purging (development|prod|test)"
    exit 1
fi


destHost=($(jq -r '.destHost' ${env}))
destDatabase=($(jq -r '.destDatabase' ${env}))
destUser=($(jq -r '.destUser' ${env}))
destPassword=($(jq -r '.destPassword' ${env}))
condition_purge=($(jq -r '.condition_purge' ${env}))
days_purge=($(jq -r '.days_purge' ${env}))
slave_lag=($(jq -r '.slave_lag' ${env}))


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
                     condition_purge="timestamp < NOW() - INTERVAL $days_purge DAY"
                     echo "purging $t"
                     eval pt-archiver --source h=${destHost},D=${destDatabase},t=${t},p=${destPassword},u=${destUser} --where "'${condition_purge}'" --purge --limit 10000 --commit-each --primary-key-only --no-check-charset --header --statistics --why-quit --retries 5 --optimize=s
                done
echo "done purging"
