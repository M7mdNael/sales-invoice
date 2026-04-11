const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const { Paths } = require('@expo/config-plugins/build/android');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

const withTrustLocalCerts = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = await setCustomConfigAsync(config, config.modResults);
    return config;
  });
};

async function setCustomConfigAsync(config, androidManifest) {
  const src = path.join(__dirname, 'network_security_config.xml');
  const resPath = path.join(
    await Paths.getResourceFolderAsync(config.modRequest.projectRoot),
    'xml', 'network_security_config.xml'
  );
  const resDir = path.resolve(resPath, '..');
  if (!fs.existsSync(resDir)) await fsPromises.mkdir(resDir, { recursive: true });
  await fsPromises.copyFile(src, resPath);
  const mainApp = getMainApplicationOrThrow(androidManifest);
  mainApp.$['android:networkSecurityConfig'] = '@xml/network_security_config';
  return androidManifest;
}

module.exports = withTrustLocalCerts;
