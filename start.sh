#!/bin/bash

# Sensemakers B.V.
# SenseRender prerender engine

# Cache lifetime set to 12 hours as requested by our friendly SEO staff
export CACHE_MIN_LENGTH=4000
export CACHE_LIFE_TIME=10
export CACHE_ROOT_DIR=/dev/shm/prerender
export CACHE_FILENAME=sensecache.html
export PORT=9030
export SENSEMAKERS_CACHE_ENABLED=1
export SENSEMAKERS_APACHE_ACCESS_LOG_ENABLED=1
export BLOCK_RESOURCES=1
export ENABLE_SCRIPTS=0

user=$(whoami)
scriptdir=$(dirname "$0") DIR=$(cd "$(dirname "$0")"; pwd)
attempt=0

if [ $user = 'deploy' ]; then

	echo "OK!"
	pushd $scriptdir

		if [ -d /dev/shm/prerender ]; then

			echo "Clearing old cache!"
			rm /dev/shm/prerender -Rf
		else

			echo "Initializing cache"
			mkdir /dev/shm/prerender
			chmod 777 /dev/shm/prerender -R
		fi
        node sensemakers.js
	popd
else

	let ++attempt
	echo "Must be run as user deploy"
	if [ $attempt -ge 2 ]; then

		echo "Couldn't login as user deploy..."
		exit 1
	else

		/bin/su deploy << 'EOF'
			pushd /home/deploy/prerender

				echo "Running script as user: "$(whoami)
				if [ -d /dev/shm/prerender ]; then
					echo "Clearing old cache!"
					rm /dev/shm/prerender -Rf
				else
					echo "Initializing cache"
					mkdir /dev/shm/prerender
					chmod 777 /dev/shm/prerender -R
				fi
				node sensemakers.js

			popd
EOF
	fi
fi