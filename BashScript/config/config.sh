#!/usr/bin/env bash
dev_host="127.0.0.1"
dev_database="hawkeye"
dev_table="audit_log"
dev_user="root"
dev_password="root"
dev_file="/var/log/archiver/"
dev_where="timestamp < NOW() - INTERVAL 90 DAY"
dev_limit="50"





