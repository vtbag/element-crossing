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
