import { ElementSpec, Spec } from './types';

const DEBUG = false;
const SVG_ANIM_KEY = '/svg';

const crossing = top!.__vtbag?.elementCrossing;
init();

function init() {
	if (crossing?.fun) {
		if (self === top) {
			return;
		}
		top!.document.title = self.document.title;
		top!.history.replaceState(self.history.state, '', self.location.href);
		self.crossingStorage = crossing.fun;
	}

	document.addEventListener('astro:after-preparation', () => {
		pageSwap();
	});
	document.addEventListener('astro:after-swap', () => {
		pageReveal();
	});

	self.addEventListener('onpageswap' in self ? 'pageswap' : 'pagehide', pageSwap, { once: true });
	self.addEventListener('onpagereveal' in self ? 'pagereveal' : 'DOMContentLoaded', pageReveal, {
		once: true,
	});
}

function pageSwap() {
	if (self.crossingStorage) {
		self.crossingStorage.setItem('@vtbag/element-crossing', retrieve());
	} else {
		top!.sessionStorage.setItem('@vtbag/element-crossing', JSON.stringify(retrieve()));
	}
}

function pageReveal() {
	let values;
	let storage;
	if ((storage = self.crossingStorage)) {
		values = storage.getItem('@vtbag/element-crossing') ?? [];
	} else {
		storage = top!.sessionStorage;
		values = JSON.parse(storage.getItem('@vtbag/element-crossing') ?? '[]');
	}
	top!.sessionStorage.removeItem('@vtbag/element-crossing');
	self.crossingStorage?.removeItem('@vtbag/element-crossing');
	if (
		performance?.navigation?.type !== 1 &&
		'navigation' in self &&
		// @ts-expect-error
		self.navigation?.navigationType !== 'reload'
	) {
		restore(values);
	}
}

function retrieve() {
	const known = new Set<string>();
	const values: ElementSpec[] = [];
	self.document.querySelectorAll<HTMLElement>('[data-vtbag-x]').forEach((element) => {
		const spec = elementSpec(element);
		if (spec) {
			if (known.has(spec.id)) console.error('[crossing]', 'non unique id', spec.id);
			values.push(spec);
			known.add(spec.id);
		}
	});
	DEBUG && console.log('[crossing]', 'retrieve', values);
	return values;
}

function elementSpec(element: HTMLElement) {
	function kindAndKey(value: string, where: HTMLElement) {
		let [kind, key] = value.split(':', 2);
		if (!kind) {
			console.error(
				'[crossing]',
				'syntax error:',
				value,
				'is not recognized as a valid specification in',
				where
			);
			return ['<none>', key];
		}
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
				case '&':
					kind = 'elem';
					if (crossing?.fun) break;
				default:
					console.error(
						'[crossing]',
						'syntax error:',
						value,
						'is not recognized as a valid specification in',
						where
					);
			}
		}
		return [kind, key];
	}

	let id = element.id;
	const specs: Spec[] = [];
	element
		.getAttribute('data-vtbag-x')
		?.trim()
		.split(/\s+/)
		.forEach((value) => {
			const [kind, key] = kindAndKey(value, element);
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
					specs.push({
						kind: type === 'boolean' ? 'bool' : type === 'number' ? 'num' : 'prop',
						key,
						value: '' + val,
					});
					break;
				case 'anim':
					if (key === SVG_ANIM_KEY) {
						if (!(element instanceof SVGSVGElement)) {
							console.error(
								'[crossing]',
								`retrieval: element is not an SVG element, but "${key}" was used for its key`,
								element
							);
							break;
						}

						const currentTime = element.getCurrentTime();
						if (currentTime > 0) {
							specs.push({ kind, key, value: currentTime.toString() });
						}
					} else {
						const animations = element
							.getAnimations()
							.filter((a) => a instanceof CSSAnimation && a.animationName === key);
						if (animations.length > 1) {
							console.error(
								'[crossing]',
								`retrieval: animation name ${key} is not unique for`,
								element
							);
						}
						if (animations.length > 0) {
							specs.push({ kind, key, value: '' + (animations[0].currentTime ?? 0) });
						}
					}
					break;
				case 'elem':
					const crossing = top?.__vtbag?.elementCrossing;
					if (crossing?.fun) {
						self.crossingStorage.setItem(key, element);
						specs.push({ kind, key });
					}
					break;
				default:
					console.error('[crossing]', 'unknown kind', kind);
					break;
			}
		});
	if (!id) console.error('[crossing]', 'missing id in', element);
	else return { id, timestamp: new Date().getTime(), specs };
}

function restore(values: ElementSpec[]) {
	DEBUG && console.log('[crossing]', 'restore', values);
	values.forEach((elementSpec: ElementSpec) => {
		let element = document.querySelector<HTMLElement>(
			'#' +
				elementSpec.id +
				",[data-vtbag-x*='#" +
				elementSpec.id +
				"'],[data-vtbag-x*='id:" +
				elementSpec.id +
				"']"
		);
		if (element) {
			elementSpec.specs.forEach((s) => {
				switch (s.kind) {
					case 'class':
						element!.classList[s.value === 'true' ? 'add' : 'remove'](s.key);
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
							element!.style.setProperty(s.key, s.value ?? '');
						}
						break;
					case 'prop':
						(element as any)[s.key] = s.value;
						break;
					case 'bool':
						(element as any)[s.key] = s.value === 'true';
						break;
					case 'num':
						(element as any)[s.key] = parseFloat(s.value ?? '0');
						break;
					case 'anim':
						if (s.key === SVG_ANIM_KEY) {
							if (!(element instanceof SVGSVGElement)) {
								console.error(
									'[crossing]',
									`restore: element for key ${s.key} is not an SVG element`,
									element
								);
								break;
							}
							element.setCurrentTime(
								parseFloat(s.value ?? '0') + (new Date().getTime() - elementSpec.timestamp) / 1000
							);
						} else {
							const animations = element!
								.getAnimations()
								.filter((a) => a instanceof CSSAnimation && a.animationName === s.key);
							if (animations.length > 1) {
								console.warn(
									'[crossing]',
									`restore: animation name ${s.key} is not unique for`,
									element
								);
							}
							animations.forEach(
								(a) =>
									(a.currentTime =
										~~(s.value ?? '0') + (new Date().getTime() - elementSpec.timestamp))
							);
						}
						break;
					case 'elem':
						const crossing = top?.__vtbag?.elementCrossing;
						if (crossing?.fun) {
							const replacement = self.crossingStorage.getItem(s.key) as HTMLElement;
							if (replacement) {
								element!.replaceWith(replacement);
								element = replacement;
							}
						}
						break;
					default:
						console.error('[crossing]', 'unknown kind', s.kind);
						break;
				}
			});
		}
	});
}
