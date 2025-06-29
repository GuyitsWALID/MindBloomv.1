// Web platform - mock Audio to prevent bundling issues
export const Audio = {
  Sound: class MockSound {
    static createAsync() {
      return Promise.resolve({ sound: new this(), status: {} });
    }
    
    async stopAsync() {
      return Promise.resolve();
    }
    
    async unloadAsync() {
      return Promise.resolve();
    }
    
    async playAsync() {
      return Promise.resolve();
    }
    
    async pauseAsync() {
      return Promise.resolve();
    }
    
    async setPositionAsync() {
      return Promise.resolve();
    }
    
    async getStatusAsync() {
      return Promise.resolve({});
    }
  }
};