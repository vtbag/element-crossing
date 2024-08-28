import type { ElementCrossing } from './types';

top!.__vtbag ??= {};
top!.__vtbag.elementCrossing ??= {};
const elementCrossing = top!.__vtbag.elementCrossing!;

if (top === self) {
	initBorderLands();
} else {
	initHeartLand();
}

function initBorderLands() {}

function initHeartLand() {
	const frameDocument = (elementCrossing.frameDocument = self.document);

	self.addEventListener('pageswap', pageSwap, { once: true });
	self.addEventListener('pagereveal', pageReveal, { once: true });
}

function pageSwap() {}

function pageReveal() {}
