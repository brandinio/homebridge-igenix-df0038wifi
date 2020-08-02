module.exports = (homebridge) => {
    // eslint-disable-next-line global-require
    const IgenixTowerFan = require('./lib/IgenixTowerFan')(homebridge);
    homebridge.registerAccessory('homebridge-igenix-tower-fan', 'IgenixTowerFan', IgenixTowerFan);
};
