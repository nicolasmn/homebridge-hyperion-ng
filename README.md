# homebridge-hyperion-ng

[Homebridge](https://github.com/homebridge/homebridge) accessory plugin for [Hyperion.ng](https://github.com/hyperion-project/hyperion.ng)

This plugin allows you to remotely control the state of your [Hyperion.ng](https://github.com/hyperion-project/hyperion.ng) controlled lights. It allows you to set the on/off state and change the brightness/color.

It optionally allows you to turn on the ambilight feature. To do so, a switch device will be created. To enable this, set the `ambilightName` parameter in the configuration file.

You can also optionally add instances that will each create an additional switch too. To enable this, set the `instances` parameter in the configuration file:

```json
"instances": [
  {
    "name": "Hue",
    "instance": 1
  }
]
```

This plugin is basically an updated mashup of the following existing plugins:

- https://github.com/danimal4326/homebridge-hyperion
- https://github.com/firsttris/homebridge-hyperion-light

# Installation

This plugin is currently WIP, to install you need to grab it directly from GitHub: `npm i -g nicolasmn/homebridge-hyperion-ng`

# Configuration

Configuration sample:

```json
"accessories": [
  {
    "accessory": "Hyperion",
    "name": "TV Backlight",
    "ambilightName": "Ambilight",
    "host": "localhost",
    "port": "19444"
  }
]
```

| Fields          | Description                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessory`     | Must always be "Hyperion" (required)                                                                                                              |
| `name`          | Can be anything (required)                                                                                                                        |
| `ambilightName` | Can be anything (optional, creates a switch to turn ambilight on/off)                                                                             |
| `instances`     | Array of additional instances. Each instance consitis of a "name" and "instance" ID (optional, creates a switch for each to turn instance on/off) |
| `host`          | The hostname or ip of the machine running Hyperion (required)                                                                                     |
| `port`          | The port that Hyperion is using (usually 19444) (required)                                                                                        |
