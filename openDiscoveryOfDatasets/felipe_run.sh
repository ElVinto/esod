npm run build &&
  sudo rm -rf  /opt/tomcat9/webapps/earthObservationDatasetOpenDiscovery/ &&
  sudo mkdir   /opt/tomcat9/webapps/earthObservationDatasetOpenDiscovery/ &&
  sudo cp -R build/*   /opt/tomcat9/webapps/earthObservationDatasetOpenDiscovery/  