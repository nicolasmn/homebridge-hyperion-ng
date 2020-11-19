const Hyperion = require("./hyperion-api");
let Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  homebridge.registerAccessory(
    "homebridge-hyperion-ng",
    "Hyperion",
    HyperionAccessory
  );
};

function HyperionAccessory(log, config) {
  if (!config["host"] || !config["port"] || !config["name"]) {
    log.error("Please define name and host in config.json");
  }

  this.log = log;
  this.name = config.name;
  this.hyperion = new Hyperion(config.host, config.port, config.name);
  this.UUID = UUIDGen.generate(this.name);
  this.ambilightName = config.ambilightName;
  this.instances = config.instances;
  this.instanceServices = [];

  this.lightService = new Service.Lightbulb(this.name);
  this.lightService.subtype = this.name;

  this.infoService = new Service.AccessoryInformation();
}

HyperionAccessory.prototype.getServices = function () {
  const services = [];

  services.push(this.lightService);
  services.push(this.infoService);

  this.lightService
    .getCharacteristic(Characteristic.On)
    .on("set", (value, callback) => {
      this.log(`${this.name}: homekit on changed to ${value}`);
      if (value) {
        this.ambilightService.updateCharacteristic(Characteristic.On, 0);
        this.instances.forEach((instance, i) => {
          this.instanceServices[i].updateCharacteristic(Characteristic.On, 0);
          this.hyperion.setInstanceOff(instance.instance);
        });
        this.hyperion.setOn(callback);
      } else {
        this.hyperion.setOff(callback);
      }
    })
    .on("get", (callback) => {
      this.hyperion.getOn(callback);
    });

  this.lightService
    .addCharacteristic(Characteristic.Brightness)
    .on("set", (value, callback) => {
      this.log(`${this.name}: homekit brightness changed to ${value}%`);
      this.hyperion.setBrightness(value, callback);
    })
    .on("get", (callback) => {
      this.hyperion.getBrightness(callback);
    });

  this.lightService
    .addCharacteristic(Characteristic.Hue)
    .on("set", (value, callback) => {
      this.log(`${this.name}: homekit hue changed to ${value}`);
      this.hyperion.setHue(value, callback);
    })
    .on("get", (callback) => {
      this.hyperion.getHue(callback);
    });

  this.lightService
    .addCharacteristic(Characteristic.Saturation)
    .on("set", (value, callback) => {
      this.log(`${this.name}: homekit saturation changed to ${value}`);
      this.hyperion.setSaturation(value, callback);
    })
    .on("get", (callback) => {
      this.hyperion.getSaturation(callback);
    });

  if (this.ambilightName && this.ambilightName.length > 0) {
    this.ambilightService = new Service.Switch(this.ambilightName);
    this.ambilightService.subtype = this.ambilightName;

    this.ambilightService
      .getCharacteristic(Characteristic.On)
      .on("set", (value, callback) => {
        this.log(`${this.ambilightName}: homekit on changed to ${value}`);
        if (value) {
          this.lightService.updateCharacteristic(Characteristic.On, 0);
          this.hyperion.setAmbiStateOn(callback);
        } else {
          this.instances.forEach((instance, i) => {
            this.instanceServices[i].updateCharacteristic(Characteristic.On, 0);
            this.hyperion.setInstanceOff(instance.instance);
          });
          this.hyperion.setOff(callback);
        }
      })
      .on("get", (callback) => {
        this.hyperion.getAmbiState(callback);
      });

    services.push(this.ambilightService);
  }

  if (this.instances && this.instances.length) {
    this.instances.forEach((instance) => {
      const instanceName = this.ambilightName + " " + instance.name;
      const instanceIndex = instance.instance;

      const instanceService = new Service.Switch(instanceName);
      instanceService.subtype = instanceName;

      instanceService
        .getCharacteristic(Characteristic.On)
        .on("set", (value, callback) => {
          this.log(`${instanceName}: homekit on changed to ${value}`);
          if (value) {
            instanceService.updateCharacteristic(Characteristic.On, 0);
            this.hyperion.setInstanceOn(instanceIndex, callback);
          } else {
            this.hyperion.setInstanceOff(instanceIndex, callback);
          }
        })
        .on("get", (callback) => {
          this.hyperion.getInstances((error, instances) => {
            const instance = instances.find(
              (instance) => instance.instance === instanceIndex
            );
            callback(error, instance.running);
          });
        });

      this.log(`Register ${instanceName} instance`);
      this.instanceServices.push(instanceService);
      services.push(instanceService);
    });
  }

  this.infoService
    .setCharacteristic(Characteristic.Manufacturer, "Hyperion")
    .setCharacteristic(Characteristic.Model, this.host)
    .setCharacteristic(Characteristic.SerialNumber, this.lightService.UUID);

  return services;
};
