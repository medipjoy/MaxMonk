// Web-compatible SQLite module - returns empty implementation on web
import { Platform } from 'react-native';

export async function openDatabaseAsync(name: string) {
  if (Platform.OS === 'web') {
    return {
      getAllAsync: async () => [],
      runAsync: async () => ({}),
    };
  }

  try {
    // eslint-disable-next-line global-require
    const SQLite = require('expo-sqlite');
    return SQLite.openDatabaseAsync(name);
  } catch {
    return {
      getAllAsync: async () => [],
      runAsync: async () => ({}),
    };
  }
}
