import tl = require("@akashic-extension/akashic-timeline");
import { Card } from "./Card";
import { CardArea } from "./CardArea";
import { Cascade } from "./Cascade";
import { FreeCell } from "./FreeCell";
import { HomeCell } from "./HomeCell";
import { MainScene } from "./MainScene";

//ゲームクラス
export class MainGame extends g.E {
	public getSameMoveCnt: (area: CardArea) => number;
	constructor() {
		const scene = g.game.scene() as MainScene;
		super({ scene: scene, width: g.game.width, height: g.game.height, touchable: true });
		const timeline = new tl.Timeline(scene);

		let isDoubleClick: boolean = false; //ダブルクリックフラグ

		// 場札
		const areas: CardArea[] = [];
		for (let i = 0; i < 8; i++) {
			const area = new Cascade(this, 125 * i + 20, 10);
			this.append(area);
			areas.push(area);
		}

		// フリーセル
		const freeCells: CardArea[] = [];
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				const area = new FreeCell(this, 120 * x + 125 * 8 + 30, y * 175 + 10);
				this.append(area);
				freeCells.push(area);
			}
		}

		// ホームセル
		const homeCells: CardArea[] = [];
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				const area = new HomeCell(this, 120 * x + 125 * 8 + 30, y * 175 + 175 * 2 + 20);
				this.append(area);
				homeCells.push(area);
			}
		}

		// カード作成
		const cards: Card[] = [];
		for (let i = 0; i < 4; i++) {
			for (let j = 1; j <= 13; j++) {
				const c = new Card(this, i, j, 500, -200);
				cards.push(c);
			}
		}

		//シャッフル
		for (let i = cards.length - 1; i >= 0; i--) {
			const j = Math.floor(g.game.random.generate() * (i + 1));
			[cards[i], cards[j]] = [cards[j], cards[i]];
		}

		//配る
		while (cards.length) {
			areas.forEach((area, i) => {
				if (!cards.length) return;
				const c = cards.pop();
				if (c.num <= scene.level + 10) {
					area.addCards([c]);
				}
			});
		}

		//ソート
		areas.forEach((area, i) => {
			area.sortCards();
		});

		//同時移動枚数の算出
		this.getSameMoveCnt = (area) => {
			// フリーセル
			let f = freeCells.filter((a) => !a.list.length && a !== area).length;

			// 場
			let e = areas.filter((a) => !a.list.length && a !== area).length;

			return (1 + f) * 2 ** e;
		};

		//スコア集計
		const setScore = (): void => {
			const mixArea = areas.concat(homeCells);
			let score = 0;
			mixArea.forEach((area) => {
				score += area.getScore();
			});
			scene.addScore(score - g.game.vars.gameState.score);
		};

		//移動(表示は更新しない)
		const stack: { srcArea: CardArea; dstArea: CardArea; num: number }[] = [];
		const move = (srcArea: CardArea, dstArea: CardArea, num: number): void => {
			const p = dstArea.list.length;
			dstArea.addCards(srcArea.list.slice(num));
			srcArea.cutCards(num);
			stack.push({ srcArea: dstArea, dstArea: srcArea, num: p });
		};

		//アンドゥ
		const undo = (): void => {
			if (!stack.length) return;
			const log = stack.pop();
			log.dstArea.addCards(log.srcArea.list.slice(log.num));
			log.srcArea.cutCards(log.num);
			log.srcArea.sortCards();
			log.dstArea.sortCards();
			setScore();
		};

		scene.undoButton.onPointDown.add(() => {
			if (!scene.isStart) return;
			scene.undoButton.frameNumber = 1;
			scene.undoButton.modified();
		});

		scene.undoButton.onPointUp.add(() => {
			if (!scene.isStart) return;
			undo();
			scene.undoButton.frameNumber = 0;
			scene.undoButton.modified();
		});

		//自動移動(ホームセルへ)
		const autoMoveHome = (): boolean => {
			let cntMove = 0;
			while (true) {
				let isMoveSub = false;
				const mixAreas = areas.concat(freeCells);
				mixAreas.forEach((area) => {
					if (!area.list.length) return;
					const lastCard = area.list.slice(-1);
					for (let i = 0; i < homeCells.length; i++) {
						const homeCell = homeCells[i];
						if (homeCell.isAddCards(lastCard)) {
							move(area, homeCell, area.list.length - 1);
							isMoveSub = true;
							lastCard[0].wait = cntMove;
							cntMove++;
							break;
						}
					}
				});
				if (!isMoveSub) break;
			}
			areas.forEach((area) => {
				area.sortCards();
			});
			homeCells.forEach((area) => {
				area.sortCards();
			});

			if (cntMove) {
				setScore();
				gameClear(); //クリア判定
			}

			return cntMove > 0;
		};

		//自動移動(フリーセルへ)
		const autoMoveFree = (ev: g.PointDownEvent): boolean => {
			for (let i = 0; i < areas.length; i++) {
				const area = areas[i];
				const cards = area.getCards(ev.point.x, ev.point.y);
				if (cards && cards.cards.length === 1) {
					for (let j = 0; j < freeCells.length; j++) {
						const freeCell = freeCells[j];
						if (freeCell.isAddCards(cards.cards)) {
							move(area, freeCell, cards.num);
							area.sortCards();
							freeCell.sortCards();
							return true;
						}
					}
				}
			}
			return false;
		};

		//クリア判定とクリア処理
		const gameClear = (): void => {
			const mixAreas = areas.concat(freeCells);
			for (let i = 0; i < mixAreas.length; i++) {
				const area = mixAreas[i];
				if (area.list.length) {
					return;
				}
			}

			//クリア処理
			scene.playSound("se_clear");
			scene.isClear = true;
		};

		// 押す
		let bkCards: { num: number; cards: Card[] } = null;
		let bkArea: CardArea = null;
		this.onPointDown.add((ev) => {
			if (!scene.isStart) return;
			bkCards = null;
			bkArea = null;

			if (isDoubleClick) {
				if (!autoMoveHome()) {
					if (autoMoveFree(ev)) {
						timeline
							.create(this)
							.wait(200)
							.call(() => {
								autoMoveHome();
							});
					}
				}
				isDoubleClick = false;
				return;
			}

			const mixAreas = areas.concat(freeCells);
			for (let i = 0; i < mixAreas.length; i++) {
				const area = mixAreas[i];
				bkCards = area.getCards(ev.point.x, ev.point.y);
				if (bkCards) {
					bkArea = area;
					bkCards.cards.forEach((card) => this.append(card)); //手前に
					break;
				}
			}

			isDoubleClick = true;
			scene.setTimeout(() => {
				isDoubleClick = false;
			}, 500);
		});

		// 移動
		this.onPointMove.add((ev) => {
			if (!scene.isStart) return;
			if (!bkCards) return;
			bkCards.cards.forEach((card) => {
				card.x += ev.prevDelta.x;
				card.y += ev.prevDelta.y;
				card.modified();
			});
		});

		// 離す
		this.onPointUp.add((ev) => {
			if (!bkCards) return;
			if (!scene.isStart) {
				bkArea.sortCards();
				return;
			}

			const mixAreas = areas.concat(freeCells.concat(homeCells));
			let isMove = false;
			for (let i = 0; i < mixAreas.length; i++) {
				const area = mixAreas[i];
				if (area === bkArea) continue;
				if (g.Collision.intersectAreas(area.collisionArea, bkCards.cards[0])) {
					if (area.isAddCards(bkCards.cards)) {
						move(bkArea, area, bkCards.num);
						area.sortCards();
						setScore();
						gameClear();
						if (scene.isAutoMove && area.title !== "home") {
							timeline
								.create(this)
								.wait(200)
								.call(() => {
									autoMoveHome();
								});
						}
						scene.playSound("se_move");
						isMove = true;
					}
					break;
				}
			}
			if (!isMove) {
				scene.playSound("se_miss");
			}

			bkArea.sortCards();
		});

		scene.setTimeout(() => {
			setScore();
		}, 200);
	}
}
