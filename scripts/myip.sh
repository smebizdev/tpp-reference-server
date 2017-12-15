# #!/bin/sh

if [ "$(uname)" == "Darwin" ] 
then
  ifconfig en0 | grep inet | grep -v inet6 | cut -d ' ' -f2    
else
  if [ "$(uname -s)" == "Linux" ] 
  then
   ifconfig eth0 | grep inet | grep -v inet6 | cut -d ' ' -f12 | cut -d ':' -f2
  fi
fi
