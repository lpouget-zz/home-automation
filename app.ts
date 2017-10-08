/// <reference path="node_modules/@types/node/index.d.ts" />

"use strict"

import * as huejay from 'huejay'
import * as events from 'events'
import * as fs from 'fs'
import * as dash_button from "node-dash-button"
//ac:63:be:47:87:1c

class Emitter extends events.EventEmitter { }

const emitter = new Emitter()

var client

let dash = dash_button('ac:63:be:47:87:1c', 'wlp1s0', null, 'udp')

dash.on("detected", function () {
	console.info("detected press")
	emitter.emit('light-switch', 3)
});

emitter.on('discover', discoverBridge)

emitter.on('light-switch', lightId => {
	client.lights.getById(lightId)
		.then(light => {
			console.log(`Light [${light.id}]: ${light.name}`);
			console.log('  State:');
			console.log(`    On:         ${light.on}`);
			console.log(`    Reachable:  ${light.reachable}`);
			console.log(`    Brightness: ${light.brightness}`);
			console.log(`    Color mode: ${light.colorMode}`);
			console.log(`    Hue:        ${light.hue}`);
			console.log(`    Saturation: ${light.saturation}`);
			console.log(`    X/Y:        ${light.xy[0]}, ${light.xy[1]}`);
			console.log(`    Color Temp: ${light.colorTemp}`);
			console.log(`    Alert:      ${light.alert}`);
			console.log(`    Effect:     ${light.effect}`);
			console.log();

			light.on = !light.on

			return client.lights.save(light)
		})
		.then(light => {
			console.log(`Updated light [${light.id}]`);
		})
		.catch(error => {
			console.log('Something went wrong');
			console.log(error.stack);
		})
})

emitter.on('discovered-bridge', bridge => {
	console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`)

	var buffer

	try {
		buffer = fs.readFileSync('./credentials.json')
	} catch (error) {
		buffer = new Buffer('')
	}

	if (buffer.byteLength > 0) {
		client = new huejay.Client({
			host: bridge.ip,
			username: JSON.parse(buffer.toString())['username']
		})

		client.users.get()
			.then(user => {
				console.log('Username:', user.username)
				console.log('Device type:', user.deviceType)
				console.log('Create date:', user.created)
				console.log('Last use date:', user.lastUsed)
			});

		client.users.getAll()
			.then(users => {
				for (let user of users) {
					console.log(`Username: ${user.username}`)
					console.log('Device type:', user.deviceType)
				}
			});

		var toDeletes = []

		for (let toDelete of toDeletes) {
			client.users.delete(toDelete)
				.then(() => {
					console.log('User was deleted');
				})
				.catch(error => {
					console.log(error.stack);
				})
		}

		client.lights.getAll()
			.then(lights => {
				for (let light of lights) {
					console.log(`Light [${light.id}]: ${light.name}`);
					console.log(`  Type:             ${light.type}`);
					console.log(`  Unique ID:        ${light.uniqueId}`);
					console.log(`  Manufacturer:     ${light.manufacturer}`);
					console.log(`  Model Id:         ${light.modelId}`);
					console.log('  Model:');
					console.log(`    Id:             ${light.model.id}`);
					console.log(`    Manufacturer:   ${light.model.manufacturer}`);
					console.log(`    Name:           ${light.model.name}`);
					console.log(`    Type:           ${light.model.type}`);
					console.log(`    Color Gamut:    ${light.model.colorGamut}`);
					console.log(`    Friends of Hue: ${light.model.friendsOfHue}`);
					console.log(`  Software Version: ${light.softwareVersion}`);
					console.log('  State:');
					console.log(`    On:         ${light.on}`);
					console.log(`    Reachable:  ${light.reachable}`);
					console.log(`    Brightness: ${light.brightness}`);
					console.log(`    Color mode: ${light.colorMode}`);
					console.log(`    Hue:        ${light.hue}`);
					console.log(`    Saturation: ${light.saturation}`);
					console.log(`    X/Y:        ${light.xy[0]}, ${light.xy[1]}`);
					console.log(`    Color Temp: ${light.colorTemp}`);
					console.log(`    Alert:      ${light.alert}`);
					console.log(`    Effect:     ${light.effect}`);
					console.log();
				}
			});
	} else {
		client = new huejay.Client({
			host: bridge.ip
		})

		const user = new client.users.User;

		// Optionally configure a device type / agent on the user
		user.deviceType = 'dash-button'; // Default is 'huejay'

		client.users.create(user)
			.then(user => {
				console.log('New user created')
				console.log('Username:', user.username)
				console.log('Device type:', user.deviceType)

				const fileDesc = fs.openSync('./credentials.json', 'w')

				fs.writeFileSync(fileDesc, JSON.stringify({
					'username': user.username,
					'deviceType': user.deviceType
				}))
				fs.closeSync(fileDesc)

				emitter.emit('discover')
			})
			.catch(error => {
				if (error instanceof huejay.Error && error.type === 101) {
					return console.log(`Link button not pressed. Try again...`)
				}

				console.log(error.stack);
			});
	}

})

function discoverBridge() {
	huejay.discover('all')
		.then(bridges => {
			for (let bridge of bridges) {
				emitter.emit('discovered-bridge', bridge)
			}
		})
		.catch(error => {
			console.log(`An error occurred: ${error.message}`);
		})
}

emitter.emit('discover')