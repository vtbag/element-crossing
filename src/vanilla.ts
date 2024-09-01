import { ElementSpec, Spec } from './types';

top!.__vtbag ??= {};
top!.__vtbag.elementCrossing ??= {};

init();

function init() {
	self.addEventListener("onpageswap" in self ? 'pageswap' : 'pagehide', pageSwap, { once: true });
	self.addEventListener("onpagereveal" in self ? 'pagereveal' : 'DOMContentLoaded', pageReveal, { once: true });
}

function pageSwap() {
	console.log('pageSwap');
	sessionStorage.setItem('@vtbag/element-crossing', JSON.stringify(retrieve()));
}

function pageReveal() {
	console.log('pageReveal');
	const values = sessionStorage.getItem('@vtbag/element-crossing');
	console.log(values);
	restore(JSON.parse(values ?? "[]"));
}

function retrieve() {
	const known = new Set<string>();
	const values: ElementSpec[] = [];
	self.document
		.querySelectorAll<HTMLElement>('[data-vtbag-x]')
		.forEach((element) => {
			const spec = elementSpec(element);
			if (spec) {
				if (known.has(spec.id)) console.error('[crossing]', 'non unique id', spec.id);
				values.push(spec);
				known.add(spec.id);
			}
		});
	return values;
}

function elementSpec(element: HTMLElement) {
	function kindAndKey(value: string) {
		let [kind, key] = value.split(':', 2);
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
					kind = 'prop';
					break;
				case '-':
					kind = 'style';
					break;
				case '~':
					kind = 'anim';
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

	let id = element.id;
	const specs: Spec[] = [];
	element
		.getAttribute('data-vtbag-x')
		?.split(' ')
		.forEach((value) => {
			const [kind, key] = kindAndKey(value);
			switch (kind) {
				case 'id':
					id = key;
					break;
				case 'class':
					specs.push({ kind, key, value: element.classList.contains(key) ? 'true' : 'false' });
					break;
				case 'style':
					specs.push({
						kind,
						key,
						value: '' + (element.style[key as keyof CSSStyleDeclaration] ?? ''),
					});
					break;
				case 'bool':
				case 'num':
				case 'prop':
					const val = element[key as keyof HTMLElement];
					const type = typeof val;
					specs.push({ kind: type === "boolean" ? "bool" : (type === "number" ? "num" : "prop"), key, value: "" + val });
					break;
				case 'anim':
					const animations = element.getAnimations().filter(a => a instanceof CSSAnimation && a.animationName === key);
					if (animations.length > 1) {
						console.error("[crossing]", `retrieval: animation name ${key} is not unique for`, element);
					}
					if (animations.length > 0) {
						specs.push({ kind, key, value: "" + (animations[0].currentTime ?? 0) });
					} break;
				default:
					console.error('[crossing]', 'unknown kind', kind);
					break;
			}
		});
	if (id === undefined) console.error('[crossing]', 'missing id in', element);
	else return { id, specs };
}

function restore(values: ElementSpec[]) {
	values.forEach((elementSpec: ElementSpec) => {
		const element = document.querySelector<HTMLElement>(
			"#" + elementSpec.id +
			",[data-vtbag-x*='#" + elementSpec.id +
			"'],[data-vtbag-x*='id:" + elementSpec.id +
			"']"
		);
		if (!element) return;
		elementSpec.specs.forEach((s) => {
			switch (s.kind) {
				case 'class':
					element.classList[s.value === 'true' ? 'add' : 'remove'](s.key);
					break;
				case 'style':
					if (s.key === 'length' || s.key === 'parentRule') {
						console.error(
							'[crossing]',
							'Cannot assign to read-only property',
							s.key,
							'in',
							elementSpec.id
						);
					} else {
						element.style.setProperty(s.key, s.value ?? '');
					}
					break;
				case 'prop':
					(element as any)[s.key] = s.value;
					break;
				case 'bool':
					(element as any)[s.key] = s.value === "true";
					break;
				case 'num':
					(element as any)[s.key] = parseFloat(s.value ?? "0");
					break;
				case 'anim':
					const animations = element.getAnimations().filter(a => a instanceof CSSAnimation && a.animationName === s.key);
					if (animations.length > 1) {
						console.warn("[crossing]", `restore: animation name ${s.key} is not unique for`, element);
					}
					animations.forEach(a => a.currentTime = ~~(s.value ?? "0"));
					element.setAttribute(s.key, s.value ?? '');
					break;
				default:
					console.error('[crossing]', 'unknown kind', s.kind);
					break;
			}
		});
	});
}
