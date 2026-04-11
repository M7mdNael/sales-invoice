const { withAndroidManifest } = require('../node_modules/@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withTrustLocalCerts = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApp = config.modResults.manifest.application[0];
    mainApp.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    // Inject the XML file path for EAS to copy
    config.modResults._networkSecurityConfigSource = path.join(
      __dirname, 'network_security_config.xml'
    );

    return config;
  });
};

module.exports = withTrustLocalCerts;
