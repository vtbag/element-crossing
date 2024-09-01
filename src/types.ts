export type ElementCrossing = {
	frameDocument?: Document | undefined;
};

declare global {
	interface Window {
		__vtbag: {
			elementCrossing?: ElementCrossing | undefined;
		};
	}
}

export type Spec = {
	kind: string;
	key: string;
	value?: string;
};
export type ElementSpec = {
	id: string;
	specs: Spec[];
};
