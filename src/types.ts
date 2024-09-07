export type CrossingStorage = {
	pseudoAddress(object: object): string;
	setItem(id: string, object: any): void;
	getItem(id: string): any | undefined;
	removeItem(id: string): void;
	clear(): void;
};

type ElementCrossing = {
	addrWeakMap: WeakMap<any, string>;
	storageMap?: Map<string, any>;
	frameDocument?: Document;
	fun: CrossingStorage;
	iframe?: HTMLIFrameElement;
};

declare global {
	interface Window {
		__vtbag: {
			elementCrossing?: ElementCrossing | undefined;
		};
		crossingStorage: ElementCrossing['fun'];
	}
}

export type Spec = {
	kind: string;
	key: string;
	value?: string;
};
export type ElementSpec = {
	id: string;
	timestamp: number;
	specs: Spec[];
};
