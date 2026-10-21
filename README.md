# Bitfaragó – online forduló

A hat feladat JavaScript-megoldása, közös magyar nyelvű kezelőfelülettel.

## Indítás

1. Töltsd le és **csomagold ki** a teljes projektet vagy a `bitfarago-online.zip` fájlt.
2. Nyisd meg az `index.html` fájlt egy modern böngészőben (Chrome, Edge, Firefox vagy Safari).
3. Válassz feladatot a kezdőoldalon.

A játékokhoz **nem kell szerver, internet, telepítés vagy Node.js**. Minden grafika, stílus és script helyi fájl. A ZIP-ből közvetlenül megnyitás helyett előbb csomagold ki az egész mappát.

## Feladatok

| # | Feladat | Megvalósítás |
|---|---|---|
| 1 | Relatív prímek | 2–100 közötti egész bemenet ellenőrzése; az összes megfelelő szám 2–100 között; euklideszi algoritmus. |
| 2 | Távolsági székfoglaló | 10–20 szék egy sorban, véletlen 5–15 értékkel; két játékos; egy körre szóló szomszédtiltás; azonnali befejezés, ha nincs lépés; pontösszesítés és felugró eredményablak a végén. |
| 3 | Itt a piros, hol a piros | 2,5 másodperces felfedés, hátlapok, 7 animált csere, 5 sebesség, egyetlen tipp és eredmény. |
| 4 | Véletlenszerű séta | Összefüggő falas térkép; csak szomszédos, szabad mezőre lép; a legkevesebbszer látogatottak közül véletlen választás; látogatásszámok; 50–1000 ms időköz, szünet és egyedi lépés. |
| 5 | Bombaszakértők | 3–15 véletlen vezeték; zöld → sárga → piros → kék → fekete, azonos színnél balról jobbra; helyes végigjátszás és azonnali hibajelzés. |
| 6 | Memóriateszt | 5–9, egymást nem metsző kör; alapérték 7; időmérés a generálástól; az 1-es után rejtett számok; sorrendellenőrzés és végidő. |

A beállított székszám, vezetékszám és körszám a következő új játékra érvényes. A séta sebessége menet közben is változtatható. Feladatváltáskor a séta szünetel, a folyamatban lévő kártya- és memóriapróba megszakad. A kiindulómező a sétában egy látogatásnak számít.

## Forráskód

- `index.html`: kezdőoldal és hat feladatfelület.
- `styles.css`: reszponzív megjelenés és játékfigurák.
- `js/core.js`: külön tesztelhető szabályok és algoritmusok.
- `js/app.js`: felület, események, időzítők és kártyaanimáció.
- `tests/core.test.cjs`: automatikus tesztek a Node.js beépített tesztfuttatójával.
- `scripts/package.cjs`: függőségmentes ZIP-készítés JavaScriptben.

## Fejlesztői ellenőrzés és beadási csomag

Ehhez a két opcionális parancshoz Node.js 18 vagy újabb szükséges; `npm install` nem kell.

```sh
npm test
npm run package
```

Az utóbbi létrehozza a `dist/bitfarago-online.zip` állományt, benne az összes megoldással és forrással. A fájlnév tartalmazza az előírt `online` szót.

## Kézi ellenőrzés

- Relatív prímek: próbáld ki az 1, 2, 100 és 101 bemeneteket.
- Székfoglaló: foglalás után a két szomszéd tiltott; egy távolabbi foglalás után a korábbi tiltás megszűnik. Játssz a végéig.
- Kártyák: próbáld a leglassabb és leggyorsabb keverést; keverés közben nem lehet tippelni.
- Séta: figyeld a számlálókat; szüneteltesd, lépj egyet, majd változtasd a sebességet.
- Bomba: játssz végig helyesen, majd egy új bombán válassz hibás sorrendet.
- Memória: kattints végig helyesen, majd próbálj hibás első és későbbi kattintást; ellenőrizd az 5 és 9 körös szinteket.
