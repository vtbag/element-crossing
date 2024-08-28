//@ts-ignore
import bench from './bench.txt';

import { setTransitionNames } from './stylesheets';
import { initDragging } from './dragging';
import { showReopener, STANDBY } from './reopener';
import { Modus, updateMessage } from './panel/modus';
import { addFrames } from './styles';
import {
	clearVtActive,
	exitViewTransition,
	mayViewTransition,
	setVtActive,
	vtActive,
} from './panel/transition';
import { initSlowMotion, setupSlowMotionPlay } from './panel/slow-motion';
import { controlledPlay, initController } from './panel/full-control';
import {
	forceAnimations,
	retrieveViewTransitionAnimations,
	unleashAllAnimations,
} from './animations';
import { initNames, updateImageVisibility, updateNames } from './panel/names';
import { initFilter } from './panel/filter';
import { twinClick } from './twin';
import { DEBUG } from './panel/debug';
import { initInnerPanel, mayCloseInner, mightHideMode } from './panel/inner';
import { getModus, setModus } from './panel/modus';

const ORIENTATION = 'vtbag-ui-panel-orientation';
const FRAMED = 'vtbag-ui-framed';
const NAMED_ONLY = 'named_only';
const titleLogo = '🔬';

top!.__vtbag ??= {};
top!.__vtbag.inspectionChamber ??= {};
const inspectionChamber = top!.__vtbag.inspectionChamber!;

if (top === self) {
	top.setTimeout(initPanel, 500);
} else {
	initSpecimen();
}

function initSpecimen() {
	const frameDocument = (inspectionChamber.frameDocument = self.document);

	self.addEventListener('pageswap', pageSwap, { once: true });
	self.addEventListener('pagereveal', prePageReveal, { once: true });
	monkeyPatchStartViewTransition();

	function monkeyPatchStartViewTransition() {
		const originalStartViewTransition = frameDocument.startViewTransition;
		if (
			originalStartViewTransition.toString() !== 'function startViewTransition() { [native code] }'
		)
			return;
		// todo: add level 2 options
		frameDocument.startViewTransition = (cb: () => void | Promise<void>) => {
			'@vtbag';
			pageSwap();
			inspectionChamber.viewTransition = originalStartViewTransition.call(
				frameDocument,
				async () => {
					await Promise.resolve();
					await cb();
					pageReveal();
				}
			);
			return inspectionChamber.viewTransition;
		};
	}
}

function pageSwap() {
	DEBUG && console.log('pageSwap');
	inspectionChamber.glow?.cancel();
	addFrames(false, false);
}

function prePageReveal(e: Event) {
	inspectionChamber.viewTransition =
		('viewTransition' in e && (e.viewTransition as ViewTransition)) || undefined;
	pageReveal();
}
function pageReveal() {
	DEBUG && console.log('pageReveal');
	if (inspectionChamber.viewTransition) {
		forceAnimations();
		beforeUpdateCallbackDone();
	}
}

function beforeUpdateCallbackDone() {
	setVtActive();
	const root = top!.document.documentElement;
	const viewTransition = inspectionChamber.viewTransition!;
	const modusFunction: Record<Modus, () => void> = {
		bypass: () => {},
		'slow-motion': setupSlowMotionPlay,
		'full-control': controlledPlay,
		compare: () => {},
	};
	const modus = getModus();

	viewTransition.updateCallbackDone.catch(() => {});

	viewTransition.ready
		.then(async () => {
			if (modus && modus !== 'bypass') {
				const canvas = top!.document.querySelector<HTMLCanvasElement>('#canvas')!;
				const timeoutId = top!.setTimeout(() => (canvas.style.zIndex = '1000'), 300);
				try {
					await retrieveViewTransitionAnimations();
					addFrames(
						!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')?.checked,
						!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')?.checked
					);
					inspectionChamber.twin!.ownerDocument.addEventListener('click', twinClick);
				} finally {
					top!.clearTimeout(timeoutId);
					top!.document.querySelector<HTMLCanvasElement>('#canvas')!.style.zIndex = '';
				}
				modusFunction[modus]();
			}
			top!.history.replaceState(history.state, '', self.location.href);
			top!.document.title = titleLogo + ' ' + self.document.title;
		})
		.finally(() => {});

	viewTransition!.finished.finally(() => {
		clearVtActive();
		inspectionChamber.viewTransition = undefined;
		inspectionChamber.frameDocument?.querySelector('#vtbag-twin--view-transition')?.remove();
		unleashAllAnimations();
		inspectionChamber.animations = undefined;
		inspectionChamber.longestAnimation = undefined;
		addFrames(
			!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')?.checked,
			!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')?.checked
		);
		updateNames(setTransitionNames());
		updateImageVisibility();
		top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-slo-mo-progress')!.innerText = '';
		top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-animations')!.innerText = '';
		!getModus() && top!.document.querySelector<HTMLLIElement>('#vtbag-ui-modi li input')?.click();
		inspectionChamber.frameDocument!.addEventListener('click', innerClick);
		mayCloseInner();
	});
}

function setBackgroundAccent() {
	const root = top!.document.documentElement;
	root.style.setProperty(
		'--vtbag-background-accent',
		root.style.colorScheme.startsWith('dark') ? '#4E545D' : '#c6d1d7'
	);
}

function setTutorialMode() {
	const toggle = top!.document.querySelector<HTMLInputElement>('#vtbag-tutorial-mode')!;
	toggle.checked = localStorage.getItem('vtbag-tutorial-mode') !== 'false';
	toggle.addEventListener('change', () => {
		localStorage.setItem('vtbag-tutorial-mode', '' + toggle.checked);
		const openedMessages = top!.document.querySelector<HTMLHeadingElement>(
			'#vtbag-ui-inner-panel #vtbag-ui-messages h4'
		);
		const closedMessages = top!.document.querySelector<HTMLHeadingElement>(
			'#vtbag-ui-panel #vtbag-ui-messages h4'
		);
		if (!toggle.checked && openedMessages) {
			openedMessages.click();
		}
		if (toggle.checked && closedMessages) {
			closedMessages.click();
		}
	});
}

async function initPanel() {
	if (top!.document.querySelector('#vtbag-ui-panel')) return;

	const root = top!.document.documentElement;
	if (top!.sessionStorage.getItem(STANDBY) === 'true') {
		showReopener();
		return;
	}
	const colorScheme = top!.getComputedStyle(root).colorScheme;
	const docTitle = top!.document.title;
	const icon = top!.document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.outerHTML ?? '';

	const page = bench
		.replace(
			'<iframe id="vtbag-main-frame" src="/"></iframe>',
			`<iframe id="vtbag-main-frame" style="opacity: 0;" src="${location.href}"></iframe>`
		)
		.replace('<title></title>', `<title>${titleLogo} ${docTitle}</title>`)
		.replace(`<link rel="icon"/>`, icon);

	top!.addEventListener('resize', setOrientation);
	root.innerHTML = page;
	root.style.colorScheme = colorScheme;
	setOrientation();
	setBackgroundAccent();
	setTutorialMode();
	setModus();
	const mainFrame = top!.document.querySelector<HTMLIFrameElement>('#vtbag-main-frame')!;
	await new Promise((r) => (mainFrame.onload = r));

	if (!top!.document.startViewTransition) {
		top!.document.querySelector('#vtbag-ui-messages')!.innerHTML = `
			<p>I'm sorry!</p><p>Native view transitions are required to make the 🔬 Inspection Chamber work, but they are not supported by this browser.</p>
			<p>Sadly have to give up.</p>`;
		top!.document
			.querySelectorAll(
				'#vtbag-ui-modi, #vtbag-ui-filter, #vtbag-ui-names, #vtbag-ui-animations, #vtbag-ui-info'
			)
			.forEach((e) => e.remove());
		return;
	}
	const frameDocument = (top!.__vtbag.inspectionChamber!.frameDocument =
		mainFrame.contentDocument!);

	updateNames(setTransitionNames());
	initPanelHandlers();
	const divider = top!.document.querySelector<HTMLDivElement>('#divider')!;
	initDragging(divider, (clientX, clientY) => {
		if (root.classList.contains('vtbag-ui-column')) {
			if (root.classList.contains('vtbag-ui-tl'))
				root.style.setProperty(
					'--vtbag-panel-width',
					`calc(max(200px, ${Math.min(innerWidth - 100, clientX)}px))`
				);
			else
				root.style.setProperty(
					'--vtbag-panel-width',
					`calc(max(200px, 100vw - ${Math.max(100, clientX + 1)}px))`
				);
		} else {
			if (root.classList.contains('vtbag-ui-tl'))
				root.style.setProperty(
					'--vtbag-panel-height',
					`calc(max(212px, ${Math.min(innerHeight - 100, clientY)}px))`
				);
			else
				root.style.setProperty(
					'--vtbag-panel-height',
					`calc(max(212px, 100vh - ${Math.max(100, clientY + 1)}px))`
				);
		}
	});
	if (localStorage.getItem('vtbag-tutorial-mode') !== 'false') {
		top!.document.querySelector<HTMLHeadingElement>('#vtbag-ui-messages h4')!.click();
	}
	mainFrame.animate([{ opacity: 0, transform: 'translateY(100vh)' }, { opacity: 1 }], {
		duration: 500,
		fill: 'forwards',
	});
	frameDocument!.addEventListener('click', innerClick);
}

function innerClick(e: MouseEvent) {
	if (vtActive()) return;
	const target = e.target as HTMLElement;
	const vt = target.closest<HTMLElement>('[data-vtbag-transition-name]');
	if (vt) {
		const name = vt.dataset.vtbagTransitionName;
		top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
			if (li.innerText === name) {
				li.click();
				if (e.ctrlKey && e.shiftKey) e.preventDefault();
			}
		});
	}
}

function setOrientation() {
	const html = top!.document.documentElement;
	const panelOrientation = top!.localStorage.getItem(ORIENTATION) ?? '';
	if (panelOrientation) {
		panelOrientation.split(' ').forEach((c) => html.classList.add(c));
		updateTurner();
	} else {
		if (
			top!.matchMedia('(orientation: landscape)').matches !==
			html.classList.contains('vtbag-ui-column')
		)
			switchOrientation();
	}
}

function switchOrientation() {
	// changing the snapshot containing block size skips the transition
	mayViewTransition(() => {
		const classes = top!.document.documentElement.classList;
		exitViewTransition();
		classes.toggle('vtbag-ui-column');
		if (classes.contains('vtbag-ui-column')) {
			classes.toggle('vtbag-ui-tl');
		}
		top!.localStorage.setItem(
			ORIENTATION,
			[...classes].filter((c) => c.startsWith('vtbag-ui-')).join(' ')
		);
		updateTurner();
	}, 'switch orientation');
}
function updateTurner() {
	const turner = top!.document.querySelector<HTMLButtonElement>('#vtbag-ui-turn')!;
	const classes = top!.document.documentElement.classList;
	turner.innerText = '⤪⤨⤩⤧'[
		(classes.contains('vtbag-ui-column') ? 2 : 0) + (classes.contains('vtbag-ui-tl') ? 1 : 0)
	];
}
function initPanelHandlers() {
	const turner = top!.document.querySelector('#vtbag-ui-turn')!;
	turner.addEventListener('click', () => switchOrientation());

	top!.document.querySelector('#vtbag-ui-light-dark')!.addEventListener('click', () => {
		const rootStyle = top!.document.documentElement.style;
		top!.document.querySelector<HTMLIFrameElement>(
			'#vtbag-main-frame'
		)!.contentDocument!.documentElement.style.colorScheme = rootStyle.colorScheme =
			rootStyle.colorScheme.startsWith('dark') ? 'light' : 'dark';
		setBackgroundAccent();
	});

	initInnerPanel();

	top!.document.querySelector('#vtbag-ui-standby')!.addEventListener('click', () => {
		top!.sessionStorage.setItem(STANDBY, 'true');
		top!.location.reload();
	});
	top!.document.querySelector('#vtbag-ui-modi ul')!.addEventListener('change', updateModus);

	initFilter();
	initNames();
	const framedCheck = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!;
	const namedOnlyCheck = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')!;
	framedCheck.addEventListener('change', frameChange);
	namedOnlyCheck.addEventListener('change', frameChange);

	function frameChange() {
		const framed = framedCheck.checked;
		const namedOnly = namedOnlyCheck.checked;
		top!.sessionStorage.setItem(FRAMED, framed ? 'X' : '');
		top!.sessionStorage.setItem(NAMED_ONLY, namedOnly ? 'X' : '');
		addFrames(framed, namedOnly);
	}

	initSlowMotion();
	initController();
	top!.document
		.querySelectorAll('#vtbag-ui-control-exit, #vtbag-ui-control-play')
		.forEach((e) => e.addEventListener('click', exitViewTransition));

	top!.addEventListener('keyup', function (e) {
		if (e.key === 'Escape') {
			if (vtActive()) {
				exitViewTransition();
			} else {
				top!.sessionStorage.setItem(STANDBY, 'true');
				top!.location.reload();
			}
		}
	});
}

function updateModus() {
	const checked = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-modi ul input:checked');
	if (checked) {
		const modus = checked.id.replace('vtbag-m-', '') as Modus;
		if (modus !== getModus()) {
			mayViewTransition(() => {
				setModus(modus);
				exitViewTransition();

				top!.document.querySelector<HTMLInputElement>('#vtbag-ui-filter ul input')!.click();
				if (modus === 'slow-motion') {
					attachFrameToggle('#vtbag-ui-slow-motion');
				}
				if (modus === 'full-control') {
					attachFrameToggle('#vtbag-ui-control');
				}
				if (modus === 'bypass') {
					attachFrameToggle('#vtbag-ui-modi');
				}
				updateMessage(modus);
				mightHideMode();
			}, 'update-modus');
		}
	}
}

function attachFrameToggle(divId: string) {
	const framed = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!;
	const namedOnly = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')!;
	const parent = framed.parentElement;
	const div = top!.document.querySelector(divId);
	framed.checked = !!top!.sessionStorage.getItem(FRAMED);
	namedOnly.checked = !!top!.sessionStorage.getItem(NAMED_ONLY);
	addFrames(framed.checked, namedOnly.checked);

	if (parent && div && parent.parentElement !== div) div.insertAdjacentElement('beforeend', parent);
}
