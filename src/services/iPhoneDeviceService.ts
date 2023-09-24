// TODO: iPhoneDeviceService

export class iPhoneDeviceService {
  public devices: iPhoneDevice[];

  constructor(deviceHosts: string[]) {
    //this.devices = deviceHosts.map((deviceHost: string) => new iPhoneDevice(deviceHost));
    this.devices = [];
  }

  async kill() {
    for (const device of this.devices) {
    }
  };
};

export class iPhoneDevice {
  public name: string;
  public uuid: string;

  constructor(name: string, uuid: string) {
    this.name = name;
    this.uuid = uuid;
  }

  async reboot() {
    const url = process.env.AGENT_URL?.toString();
    const response = await fetch(url!, {
      method: 'POST',
      body: JSON.stringify({
        type: 'restart',
        device: name,
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.warn('error:', response);
      return false;
    }
  
    let body;
    try {
      body = await response.json();
      const result = body.status === 'ok';
      console.log('body:', body, 'result:', result);
      return result;
    } catch (err) {
      console.error(err);
    }
    return false;
  }
};