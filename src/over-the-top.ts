import { Spec } from './types';

top!.__vtbag ??= {};
top!.__vtbag.elementCrossing ??= {};
const elementCrossing = top!.__vtbag.elementCrossing!;

console.log('[elc]', 'init');
if (top === self) {
	initBorderLands();
} else if (self.parent === top) {
	initHeartLand();
} else {
	console.log('[elc]', 'neither BorderLands nor HeartLand');
}

function initBorderLands() {
	console.log('[elc]', 'init BorderLands');
	addEventListener('pagereveal', () => {
		console.log('[elc]', 'DOMContentLoaded');
		const topDoc = top!.document;
		const root = topDoc.documentElement;
		root.innerHTML = `<body style="margin:0; overflow=clip"><iframe width=${innerWidth} height=${innerHeight} src="${location.href}"/>`;
		root.style.overflow = 'clip';
	});
}

function initHeartLand() {
	console.log('[elc]', 'init HeartLand');
	self.addEventListener('pageswap', pageSwap, { once: true });
	self.addEventListener('pagereveal', pageReveal, { once: true });
}

function pageSwap() {
	console.log('[elc]', 'pageSwap');

	self.document.querySelectorAll<HTMLElement>('[data-vtbag-x]').forEach((el) => {
		let id;
		const specs: Spec[] = [];
		el
			.getAttribute('data-vtbag-x')
			?.split(' ')
			.forEach((value) => {
				const [kind, key] = kindAndKey(value);
				switch (kind) {
					case 'id':
						id = key;
						break;
					case 'class':
						specs.push({ kind, key, value: el.classList.contains(key) ? 'true' : 'false' });
						break;
					case 'style':
						specs.push({
							kind,
							key,
							value: '' + (el.style[key as keyof CSSStyleDeclaration] ?? ''),
						});
						break;
					case 'attr':
						specs.push({ kind, key, value: el.getAttribute(key) ?? '' });
						break;
					default:
						console.error('[crossing]', 'unknown kind', kind);
						break;
				}
			});
	});
}

function pageReveal() {
	console.log('[elc]', 'pageReveal');
	const topDoc = top!.document;
	topDoc.title = document.title;
	top!.history.replaceState({}, '', location.href);
}

function kindAndKey(value: string) {
	let [kind, key] = value.split(':');
	if (key === undefined) {
		key = kind.slice(1);
		switch (kind[0]) {
			case '#':
				kind = 'id';
				break;
			case '.':
				kind = 'class';
				break;
			case '@':
				kind = 'attr';
				break;
			case '-':
				kind = 'style';
				break;
			default:
				console.error(
					'[crossing]',
					'syntax error:',
					value,
					'is not recognized as a valid specification'
				);
		}
	}
	return [kind, key];
}
