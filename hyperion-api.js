const net = require("net");
const Color = require("color");

class HyperionApi {
  constructor(host, port, name) {
    this.host = host;
    this.port = port;
    this.name = name;

    this.color = Color;
    this.selectedColor = this.color.rgb(255, 255, 255);

    this.ledState = false;
    this.ambiState = false;
    this.effectState = false;
    this.lightState = false;

    this.cmd = {
      clear: {
        command: "clear",
        priority: 100,
      },
      color: {
        command: "color",
        priority: 100,
        color: this.selectedColor.rgb().round().array(),
        origin: name,
      },
      on: {
        command: "componentstate",
        componentstate: {
          component: "ALL",
          state: true,
        },
      },
      off: {
        command: "componentstate",
        componentstate: {
          component: "ALL",
          state: false,
        },
      },
      serverInfo: {
        command: "serverinfo",
        tan: 1,
      },
      instanceOn: {
        command: "instance",
        subcommand: "startInstance",
        instance: 1,
      },
      instanceOff: {
        command: "instance",
        subcommand: "stopInstance",
        instance: 1,
      },
    };
  }

  send(command, callback) {
    const client = new net.Socket();
    let response = "";

    client.connect(this.port, this.host, () => {
      if (!Array.isArray(command)) {
        command = [command];
      }

      command.forEach((currentCommand) => {
        const string = JSON.stringify(currentCommand) + "\n";
        client.write(string);
      });
    });

    client.on("error", (error) => {
      callback(error, response);
    });

    client.on("data", (data) => {
      response += data.toString();
      client.end();
    });

    client.on("end", () => {
      const responses = response.split("\n");
      const object = JSON.parse(responses[responses.length - 2]);
      if (callback) callback(null, object);
    });

    client.on("timeout", function () {
      client.destroy("timeout");
    });
  }

  getInstances(callback) {
    this.send(this.cmd.serverInfo, (error, data) => {
      if (data.info.instance) {
        callback(null, data.info.instance);
      }
    });
  }

  setInstanceOn(instance, callback) {
    this.cmd.instanceOn.instance = instance;
    this.send(this.cmd.instanceOn, callback);
  }

  setInstanceOff(instance, callback) {
    this.cmd.instanceOff.instance = instance;
    this.send(this.cmd.instanceOff, callback);
  }

  setColor(color, callback) {
    this.selectedColor = color;
    this.cmd.color.color = color.rgb().round().array();
    this.send(this.cmd.color, callback);
  }

  getColor(callback) {
    callback(null, this.selectedColor);
  }

  setOn(callback) {
    this.send(this.cmd.on, callback);
  }

  verifyLightState(data) {
    if (data && data.info.activeLedColor) {
      this.ledState = data.info.activeLedColor.length > 0;
      // this.effectState = data.info.activeEffects.length > 0;
    }
  }

  verifyOn() {
    this.lightState = this.ledState && !this.effectState;
  }

  verifyAmbiState(data) {
    if (data && data.info.components) {
      const v4lComponent = data.info.components.find(
        (component) => component.name === "V4L"
      );

      const v4lPriority = data.info.priorities.find(
        (component) => component.componentId === "V4L"
      );

      this.ambiState =
        !this.ledState &&
        !this.effectState &&
        v4lComponent.enabled &&
        v4lPriority.active;
    }
  }

  extractColorFromData(data) {
    if (this.lightState && data && data.info.activeLedColor) {
      this.selectedColor = this.color.rgb(
        data.info.activeLedColor[0]["RGB Value"]
      );
    }
  }

  getOn(callback) {
    this.send(this.cmd.serverInfo, (error, data) => {
      this.verifyLightState(data);
      this.verifyOn();
      this.extractColorFromData(data);
      callback(error, this.ledState);
    });
  }

  setOff(callback) {
    this.send([this.cmd.clear, this.cmd.off], callback);
  }

  setAmbiStateOn(callback) {
    this.send([this.cmd.clear, this.cmd.on], callback);
  }

  getAmbiState(callback) {
    this.send(this.cmd.serverInfo, (error, data) => {
      this.verifyLightState(data);
      this.verifyAmbiState(data);
      callback(error, this.ambiState);
    });
  }

  setBrightness(value, callback) {
    if (value >= 0) {
      this.selectedColor = this.selectedColor.value(value);
      this.setColor(this.selectedColor, callback);
    } else {
      this.setOff(callback);
    }
  }

  getBrightness(callback) {
    this.send(this.cmd.serverInfo, (error, data) => {
      this.verifyLightState(data);
      this.verifyOn();
      this.extractColorFromData(data);
      callback(error, this.selectedColor.value());
    });
  }

  setHue(value, callback) {
    this.selectedColor = this.selectedColor.hue(value);
    this.setColor(this.selectedColor, callback);
  }

  getHue(callback) {
    this.send(this.cmd.serverInfo, (error, data) => {
      this.verifyLightState(data);
      this.verifyOn();
      this.extractColorFromData(data);
      callback(error, Math.round(this.selectedColor.hue()));
    });
  }

  setSaturation(value, callback) {
    this.selectedColor = this.selectedColor.saturationv(value);
    this.setColor(this.selectedColor, callback);
  }

  getSaturation(callback) {
    this.send(this.cmd.serverInfo, (error, data) => {
      this.verifyLightState(data);
      this.verifyOn();
      this.extractColorFromData(data);
      callback(error, Math.round(this.selectedColor.saturationv()));
    });
  }
}

module.exports = HyperionApi;
