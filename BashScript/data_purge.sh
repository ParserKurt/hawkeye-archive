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


host=($(jq -r '.host' $env))
database=($(jq -r '.database' $env))
table=($(jq -r '.table' $env))
user=($(jq -r '.user' $env))
password=($(jq -r '.password' $env))
file=($(jq -r '.file' $env))
condition=($(jq -r '.condition' $env))


if [ $# -eq 2 ]
then
    if [ $2 = "all" ]
    then
        getArray "config/tables.txt"
        for t in "${array[@]}"
        do
            eval sudo pt-archiver --source h=$host,D=$database,t=$t,p=$password,u=$user --file "'$file`date +%Y-%m-%d`_$t '" --where "'$condition'" --limit 1 --txn-size 1 --no-check-charset --header --no-delete --statistics
        done
        exit 1
    fi
    else

        echo -e "please enter table name"
        read -a table

        echo -e "please enter where condition"
        read -a where

        echo -e "Do you want to purge the data [Y/N]"
        read -a purge

        echo -e "Do you want to save data to database? [Y/N]"
        read -a savedb

        if [ ${savedb[0]} = "Y" ]
        then
            echo -e "Please enter db destination [h=hostname,D=databasename]"
            read -a destination
        fi


        if [ ${purge[0]} = "N" ]
        then
            purge="--no-delete"
        else
            purge=""
        fi


        echo 'sudo pt-archiver --source h=$host,D=$database,t=${table[0]},p=$password,u=$user --dest ${destination[0]} --file "'$file`date +%Y-%m-%d`_${table[0]} '" --where "'${where[0]}'" --limit 1 --txn-size 1 --no-check-charset --header ${purge[0]} --statistics'
        eval sudo pt-archiver --source h=$host,D=$database,t=${table[0]},p=$password,u=$user --dest ${destination[0]} --file "'$file`date +%Y-%m-%d`_${table[0]} '" --where "'${where[0]}'" --limit 1 --txn-size 1 --no-check-charset --header $purge --statistics
fi
exit 1
