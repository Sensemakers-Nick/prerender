# Windows script
# Cache lifetime set to 12 hours 
set CACHE_MIN_LENGTH=4000
set CACHE_LIFE_TIME=10
set CACHE_FILENAME=sensecache.html
set PORT=9030
set SENSEMAKERS_CACHE_ENABLED=1
set SENSEMAKERS_APACHE_ACCESS_LOG_ENABLED=1
set BLOCK_RESOURCES=0
set ENABLE_SCRIPTS=0

node sensemakers.js

exit