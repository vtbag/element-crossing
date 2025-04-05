top!.__vtbag ??= {};

const crossing = (top!.__vtbag.elementCrossing ??= {
	storageMap: new Map<string, Element>(),
	addrWeakMap: new WeakMap<any, string>(),
	fun: {
		pseudoAddress(object: object): string {
			let addr = '0x000000';
			if (object === null || object === undefined) return addr;
			while (addr === '0x000000') {
				addr =
					crossing.addrWeakMap.get(object) ??
					'0x' + Math.random().toString(16).slice(2, 8).toUpperCase();
			}
			crossing.addrWeakMap.set(object, addr);
			return addr;
		},
		setItem(id: string, element: Element) {
			crossing.storageMap!.set(id, element);
		},
		getItem(id: string): Element | undefined {
			const element = crossing.storageMap!.get(id);
			return element;
		},
		removeItem(id: string): void {
			crossing.storageMap!.delete(id);
		},
		clear(): void {
			crossing.storageMap!.clear();
		},
	},
});

top === self && initBorderLands();

function initBorderLands() {
	top!.addEventListener('pagereveal', () => {
		const topDoc = top!.document;
		const lang = topDoc.documentElement.lang;
		const colorScheme = topDoc.documentElement.style.colorScheme;
		const root = topDoc.createElement('html');
		root.innerHTML = `<body style="margin:0; overflow=clip"><iframe width=${innerWidth} height=${innerHeight} style="border:0" src="${location.href}"></iframe>`;
		crossing.iframe = root.querySelector<HTMLIFrameElement>('iframe')!;
		root.lang = lang;
		root.style.overflow = 'clip';
		root.style.colorScheme = colorScheme;
		topDoc.documentElement.replaceWith(root);
		crossing.frameDocument = topDoc.querySelector<HTMLIFrameElement>('iframe')!.contentDocument!;
	});
	top!.addEventListener('resize', () => {
		crossing.iframe!.width = '' + top!.innerWidth;
		crossing.iframe!.height = '' + top!.innerHeight;
	});
}
