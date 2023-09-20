import adb, { DeviceClient } from '@devicefarmer/adbkit';
import Bluebird from 'bluebird';
import { createWriteStream, existsSync, readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import path from 'node:path';

const client = adb.createClient();
const BasePath = '/data/local/tmp';

// Reference: https://github.com/DeviceFarmer/adbkit

export class AndroidDeviceService {
  public devices: AndroidDevice[];

  constructor(deviceHosts: string[]) {
    this.devices = deviceHosts.map((deviceHost: string) => new AndroidDevice(deviceHost));
  }

  async kill() {
    for (const device of this.devices) {
      await device.disconnect();
    }
  };
};

export class AndroidDevice {
  public deviceHost: string;
  public port: number;
  public deviceId: string;

  private deviceClient: DeviceClient;

  constructor(deviceHost: string, port: number = 5555) {
    this.deviceHost = deviceHost;
    this.port = port;
    this.deviceId = `${deviceHost}:${port}`;
    this.deviceClient = client.getDevice(this.deviceHost);
  }

  async connect() {
    try {
      await client.connect(this.deviceHost, this.port);
      return true;
    } catch (err: any) {
      console.error(`[${this.deviceId}] Connection error: ${err.message}`);
      return false;
    }
  };
  
  async disconnect() {
    try {
      await client.disconnect(this.deviceHost, this.port);
      return true;
    } catch (err: any) {
      console.error(`[${this.deviceId}] Connection error: ${err.message}`);
      return false;
    }
  };
  
  async rebootDevice() {
    const result = await this.deviceClient.reboot();
    return result.valueOf();
  };

  async downloadFile(url: string, destination: string) {
    try {
      const response: any = await fetch(url);
      if (!existsSync('../../static/apks')) {
        await mkdir('../../static/apks');
      }
      const fileStream = createWriteStream(destination, { flags: 'wx' });
      await finished(Readable.fromWeb(response.body).pipe(fileStream));
      console.log('download response:', response);
    } catch (err: any) {
      console.error(`[${this.deviceId}] error:`, err.stack);
    }
  };

  async installApp(apkName: string = 'pogov7.apk') {
    try {
      const apk = `../../static/apks/${apkName}`;
      if (!existsSync(apk)) {
        return false;
      }

      const result = await this.deviceClient.install(apk);
      console.log(`[${this.deviceId}] Installed ${apk} on device`);
      return result;
    } catch (err) {
      console.error(`[${this.deviceId}] error:`, err.stack);
      return false;
    }
  };

  async features() {
    try {
      const features = await this.deviceClient.getFeatures();
      console.log(`[${this.deviceId}] Features: ${features}`);
      return features;
    } catch (err) {
      console.error(`[${this.deviceId}] error:`, err.stack);
      return false;
    }
  };

  async properties() {
    try {
      const properties = await this.deviceClient.getProperties();
      console.log(`[${this.deviceId}] Properties: ${properties}`);
      return properties;
    } catch (err) {
      console.error(`[${this.deviceId}] error:`, err.stack);
      return false;
    }
  };

  async packages() {
    try {
      const packages = await this.deviceClient.getPackages();
      return packages;
    } catch (err) {
      console.error(`[${this.deviceId}] error:`, err.stack);
      return false;
    }
  };

  async getScreenshot() {
    try {
      const source = BasePath + `/atlas.log`;
      const destination = path.resolve(__dirname, `../../static/screens/${this.deviceHost}.png`);
      const screen = await this.deviceClient.screencap();
      await new Bluebird((resolve, reject) => {
        screen.on('error', reject);
        screen.on('data', (chunk: any) => {
          console.log(`[${this.deviceId}] Data ${chunk.length} bytes so far`);
        })
        //screen.on('end', () => {
        //  console.log(`[${this.deviceId}] Pull complete`);
        //  resolve(this.deviceHost);
        //});
        screen.pipe(createWriteStream(destination));
      });
      console.log(`[${this.deviceId}] Pulled ${source} to ${destination}`);
      return destination;
    } catch (err) {
      console.error(`[${this.deviceId}] error:`, err.stack);
    }
  };

  async getLog() {
    try {
      const source = BasePath + `/atlas.log`;
      const destination = path.resolve(__dirname, `../../static/logs/${this.deviceHost}.log`);
      const transfer = await this.deviceClient.pull(source);
      await new Bluebird((resolve, reject) => {
        //transfer.on('progress', (stats: any) =>
        //  console.log(`[${this.deviceId}] Pulled ${stats.bytesTransferred} bytes so far`),
        //);
        transfer.on('end', () => {
          //console.log(`[${this.deviceId}] Pull complete`);
          resolve(this.deviceHost);
        });
        transfer.on('error', reject);
        transfer.pipe(createWriteStream(destination));
      });
      console.log(`[${this.deviceId}] Pulled ${source} to ${destination}`);
      const data = readFileSync(destination, { encoding: 'utf-8' });
      return data;
    } catch (err) {
      console.error(`[${this.deviceId}] error:`, err.stack);
    }
  };

  async deleteLogs() {
    try {
      const cmd = `rm -rf ${BasePath}/*.log`;
      this.deviceClient.shell(cmd);
      console.log(`[${this.deviceId}] Deleted all logs in ${BasePath}`);
    } catch (err: any) {
      console.error(`[${this.deviceId}] error:`, err.stack);
    }
  };

  async shell(command: string) {
    try {
      const stream = await this.deviceClient.shell(command);
      const response = await adb.util.readAll(stream);
      return response.toString();
    } catch (err: any) {
      console.error(`[${this.deviceId}] error:`, err.stack);
    }
  };

  async startService(name: string) {
    try {
      const service = serviceByName(name);
      if (!service) {
        console.warn(`[${this.deviceId}] Failed to start service: service not found '${name}'`);
        return false;
      }

      const result = await this.deviceClient.startService({
        component: service,
      });
      console.log(`[${this.deviceId}] Started service ${name} (${service}): ${result}`);
      return result;
    } catch (err: any) {
      console.error(`[${this.deviceId}] error:`, err.stack);
      return false;
    }
  };

  async stopService(name: string) {
    try {
      const service = serviceByName(name);
      if (!service) {
        console.warn(`[${this.deviceId}] Failed to stop service: service not found '${name}'`);
        return false;
      }

      const command = `su -c "am stopservice ${service}"`;
      const binaryResult = await this.deviceClient.shell(command);
      const result = await adb.util.readAll(binaryResult);
      console.log(`[${this.deviceId}] Stopped service ${name} (${service}): ${result}`);
      return result.includes('Service stopped');
    } catch (err: any) {
      console.error(`[${this.deviceId}] error:`, err.stack);
      return false;
    }
  };
};

const serviceByName = (name: string) => {
  switch (name) {
    case 'atlas':
    case 'pogo':
      return 'com.pokemod.atlas/com.pokemod.atlas.services.MappingService';
    case 'vnc':
      return 'net.christianbeier.droidvnc_ng/.MainService';
  }
};