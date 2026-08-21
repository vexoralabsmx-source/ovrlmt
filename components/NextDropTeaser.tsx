export function NextDropTeaser() {
  return (
    <section className="next-drop" aria-labelledby="next-drop-title">
      <div className="next-drop-grid" aria-hidden="true" />

      <header className="next-drop-head">
        <div className="next-drop-meta">
          <p className="section-label">NEXT FILE / DROP 005</p>
          <span className="next-drop-signal"><i /> TRANSMISIÓN ACTIVA</span>
        </div>

        <h2 id="next-drop-title">LA SIGUIENTE<br /><em>FORMA</em> YA EMPEZÓ.</h2>

        <div className="next-drop-copy">
          <p>No vas a ver la prenda todavía. Solo el código visual: líneas tensas, metal frío y una estructura hecha para romper el silencio.</p>
          <span>REVEAL / FECHA CLASIFICADA</span>
        </div>
      </header>

      <div className="next-drop-art" aria-hidden="true">
        <div className="next-drop-scan" />
        <span className="next-drop-coordinate top">DESIGN TRACE_005</span>
        <span className="next-drop-coordinate bottom">OVRLMT / UNRELEASED SYSTEM</span>

        <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="next-drop-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#515151" />
              <stop offset="0.5" stopColor="#f1f1ed" />
              <stop offset="1" stopColor="#595959" />
            </linearGradient>
            <g id="next-drop-branch">
              <path d="M594 265C516 244 468 207 416 154C367 105 317 82 240 72" />
              <path d="M535 237C479 229 420 226 356 245C300 262 244 255 180 219" />
              <path d="M474 209C425 174 394 136 374 91" />
              <path d="M429 165C387 157 348 166 306 191" />
              <path d="M364 122C337 99 325 75 321 44" />
              <path d="M336 101C302 108 275 124 245 151" />
              <path d="M526 255C454 277 405 314 358 365C320 407 278 431 218 445" />
              <path d="M468 286C420 283 370 295 320 325C268 356 216 365 154 352" />
              <path d="M403 321C370 352 349 391 340 438" />
              <path d="M357 365C317 359 283 369 248 394" />
              <path d="M301 405C277 427 265 452 264 481" />
              <path d="M277 426C245 419 217 422 184 438" />
            </g>
          </defs>

          <g className="next-drop-ghost">
            <use href="#next-drop-branch" />
            <use href="#next-drop-branch" transform="translate(1200 0) scale(-1 1)" />
          </g>
          <g className="next-drop-lines">
            <use href="#next-drop-branch" />
            <use href="#next-drop-branch" transform="translate(1200 0) scale(-1 1)" />
            <path className="next-drop-spine" d="M600 34L600 486M600 84L577 119L600 104L623 119M600 182L570 219L600 203L630 219M600 300L566 337L600 318L634 337M600 407L578 444L600 429L622 444" />
            <path className="next-drop-core" d="M600 143L566 177L548 247L600 286L652 247L634 177ZM600 286L558 326L600 389L642 326Z" />
          </g>

          <g className="next-drop-ticks">
            <path d="M80 76H155M80 76V126M1045 76H1120M1120 76V126M80 394V444H155M1045 444H1120V394" />
            <path d="M94 260H132M1068 260H1106M600 12V28M600 492V508" />
          </g>
        </svg>

        <div className="next-drop-file-number">
          <span>FILE</span>
          <strong>005</strong>
          <small>LOCKED</small>
        </div>
      </div>

      <footer className="next-drop-foot">
        <span>01 / BLACK SIGNAL</span>
        <span>02 / SILVER TRACE</span>
        <span>03 / NO PREVIEW</span>
        <strong>PRÓXIMAMENTE</strong>
      </footer>
    </section>
  );
}
