class LocalStorage {
	async loadStorage(key: string): Promise<string | null> {
		const data = await localStorage.getItem(key);
		return data;
	}
	async saveStorage(key: string, data: string): Promise<void> {
		await localStorage.setItem(key, data);
	}
}

// export { LocalStorage };
