import adb, { DeviceClient } from '@devicefarmer/adbkit';
import Bluebird from 'bluebird';
import { createWriteStream, existsSync, readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const client = adb.createClient();
const BasePath = '/data/local/tmp';

// TODO: Pull from local file
export const DeviceHosts = [
  'atv01',
  'atv02',
  'atv03',
  'atv04',
  'atv05',
  'atv06',
  'atv07',
  'atv08',
  'atv09',
  'atv10',
  'atv11',
  'atv12',
  'atv13',
  'atv14',
  'atv15',
  'atv16',
  'atv17',
  'atv18',
  'atv19',
  'atv20',
  'atvRC01',
  'atvUP01',
  'atvON01',
  'atvPO01',
  'atvLL01',
  'atvIR01',
  'atvLF01',
  'atvSG01',
  'atvDTLA01',
  'atvSA01',
  'atvMV01',
  'atvPA01',
  'atvRSM01',
  'atvELA01',
  'atvCH01',
  'atvNW01',
  'atvAZ01',
  'atvRL01',
  'atvLO01',
  'atvTO01',
  'atvHH01',
  'atvRH01',
  'atvMF01',
  'atvMF02',
  'atvAL01',
  'atvAR01',
  'atvDU01',
  'atvEM01',
  'atvMO01',
  'atvTC01',
  'atvAH01',
  'atvCM01',
  'atvFV01',
  'atvOR01',
  'atvTU01',
  'atvIR02',
  'atvGG01',
  'atvLF02',
  'atvMV02',
  'atvSA02',
  'atvRC02',
  'atvON02',
  'atvUP02',
  'atvSG02',
  'atvRB01',
  'atvRB02',
  'atvTO02',
  'atvDTLA02',
  'atvWM01',
  'atvCY01',
  'atvIR03',
  'atvLF03',
  'atvRSM02',
  'atvCL01',
  'atvMPK01',
  'atvFO01',
  'atvSB01',
  'atvRM01',
  'atvCT01',
  'atvGL01',
  'atvWL01',
  'atvCNA01',
  'atvCNA02',
  'atvCM02',
];

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
      if (!existsSync('./static/apks')) {
        await mkdir('./static/apks');
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
      const apk = `./static/apks/${apkName}`;
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
      const destination = `./static/screens/${this.deviceHost}.png`;
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
      const destination = `./static/logs/${this.deviceHost}.log`;
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