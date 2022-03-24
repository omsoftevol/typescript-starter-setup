#!/bin/bash

CONTAINER_NAME=starter-project-mysql

USAGE="Usage: ./mysql.sh client|server|dump <args>"

#if no arguments
if [ "$#" == "0" ]; then
  echo "$USAGE"
  exit 1
fi

MODE=$1
shift

#docker exec flags depending if caller is an interactive terminal or a pipe
TTY_FLAGS=-i
if [ -t 0 ]; then
  TTY_FLAGS=-ti
fi

case $MODE in
  client)
    exec docker exec $TTY_FLAGS $CONTAINER_NAME mysql -h 127.0.0.1 $@
  ;;

  server)
    EXISTS=$(docker ps -a | grep $CONTAINER_NAME)

    if [ $? -eq 0 ]; then
      docker start $CONTAINER_NAME
    else
      docker run -ti -d --network=host --name $CONTAINER_NAME -e MYSQL_ALLOW_EMPTY_PASSWORD=1 mysql:8
    fi
  ;;

  dump)
    exec docker exec $TTY_FLAGS $CONTAINER_NAME mysqldump -h 127.0.0.1 $@
  ;;

  *)
    echo "$USAGE"
    exit 1
  ;;
esac
