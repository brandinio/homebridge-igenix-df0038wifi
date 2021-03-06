const TuyaAccessory = require('./TuyaAccessory');
const { callbackify } = require('./utils');

let Service;
let Characteristic;

class IgenixTowerFan extends TuyaAccessory {
    constructor(log, config) {
        super(log, config);

        this.informationService = null;
        this.fanService = null;
    	this.storeSettings = config.storeSettings;
    	this.storedOscillate = null;
		this.storedSpeed = null;
    
    	setInterval(() => {
        	this.getProperty(1).then(active => {
            	if(active == true) {
        			this.getProperty(102).then(swingMode => {
            			this.storedOscillate = swingMode;
            			this.fanService.updateCharacteristic(Characteristic.SwingMode, this.storedOscillate);
            			this.getProperty(2).then(fanSpeed => {
            				this.storedSpeed = fanSpeed;
                			this.fanService.updateCharacteristic(Characteristic.RotationSpeed, this.storedSpeed);
                		});
            		});
                }
            });
        
        }, (config.pollInterval || 10) * 1000, this);
    	
    }

    getServices() {
        return [this.getInformationService(), this.getfanService()];
    }

    getInformationService() {
        if (this.informationService != null) {
            return this.informationService;
        }

        const informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Igenix')
            .setCharacteristic(Characteristic.Model, 'DF0038WIFI')
            .setCharacteristic(Characteristic.SerialNumber, this.serialNumber);

        this.informationService = informationService;
        return informationService;
    }

    getfanService() {
        if (this.fanService != null) {
            return this.fanService;
        }

        const fanService = new Service.Fanv2(this.name);

        fanService.getCharacteristic(Characteristic.Active)
            .on('get', this.getActiveCharacteristic.bind(this))
            .on('set', this.setActiveCharacteristic.bind(this));

        fanService.getCharacteristic(Characteristic.SwingMode)
            .on('get', this.getSwingModeCharacteristic.bind(this))
            .on('set', this.setSwingModeCharacteristic.bind(this));

        fanService.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({
                unit: undefined,
                minValue: 1,
                maxValue: 8,
                minStep: 1,
            })
            .on('get', this.getRotationSpeedCharacteristic.bind(this))
            .on('set', this.setRotationSpeedCharacteristic.bind(this));

        this.fanService = fanService;
        return fanService;
    }

    async getIsActive() {
        const status = await this.getProperty(1);
        return status
            ? Characteristic.Active.ACTIVE
            : Characteristic.Active.INACTIVE;
    }

    async setIsActive(isActive) {
        const status = isActive === Characteristic.Active.ACTIVE;
        await this.setProperty(1, status);
    	
        if (status == true && this.storeSettings == true) {
        	if (this.storedOscillate != null && this.storedSpeed != null) {
            	this.fanService.updateCharacteristic(Characteristic.RotationSpeed, this.storedSpeed);
            	this.fanService.updateCharacteristic(Characteristic.SwingMode, this.storedOscillate);
        		await this.setProperty(102, this.storedOscillate);
        		await this.setProperty(2, this.storedSpeed);
            }
        }
    }

    async getSwingMode() {
        const oscillate = await this.getProperty(102);
        return oscillate
            ? Characteristic.SwingMode.SWING_ENABLED
            : Characteristic.SwingMode.SWING_DISABLED;
    }

    async setSwingMode(mode) {
        const oscillate = mode === Characteristic.SwingMode.SWING_ENABLED;
    	this.storedOscillate = oscillate;
        await this.setProperty(102, oscillate);
    }

    async getRotationSpeed() {
        const fanSpeed = await this.getProperty(2);
        return Number(fanSpeed);
    }

    async setRotationSpeed(speed) {
        const fanSpeed = speed.toString();
    	this.storedSpeed = fanSpeed;
        await this.setProperty(2, fanSpeed);
    }

    // MARK: Callback functions
    getActiveCharacteristic(callback) {
        callbackify(this.getIsActive(), callback);
    }

    setActiveCharacteristic(isActive, callback) {
        callbackify(this.setIsActive(isActive), callback);
    }

    getSwingModeCharacteristic(callback) {
        callbackify(this.getSwingMode(), callback);
    }

    setSwingModeCharacteristic(mode, callback) {
        callbackify(this.setSwingMode(mode), callback);
    }

    getRotationSpeedCharacteristic(callback) {
        callbackify(this.getRotationSpeed(), callback);
    }

    setRotationSpeedCharacteristic(speed, callback) {
        callbackify(this.setRotationSpeed(speed), callback);
    }

}

module.exports = (homebridge) => {
    // eslint-disable-next-line prefer-destructuring
    Service = homebridge.hap.Service;
    // eslint-disable-next-line prefer-destructuring
    Characteristic = homebridge.hap.Characteristic;

    return IgenixTowerFan;
};
