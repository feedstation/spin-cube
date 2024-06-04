class LiveCube extends HTMLElement {
    static observedAttributes = ['size', 'x', 'y', 'spin'];
    static count = 0;
    #firstRun = true;
    xReset;
    yReset;
    size;
    moveCoords = {
        start: {},
        //last: {};
    };
    controller; //for abort controllers

    constructor() {
        super();
        this.count = ++LiveCube.count;
        const shadow = this.attachShadow({ mode: 'open' });
    }

    repaint() {
        //TODO determine risks of user data in attributes and take steps:
        const attrsUnsafe = {
            x: this.getAttribute('x'),
            y: this.getAttribute('y'),
            size: this.getAttribute('size'),
        }

        //set globals based on attributes:
        this.xReset = parseInt(attrsUnsafe.x) || -42;
        this.yReset = parseInt(attrsUnsafe.y) || -23;

        if(attrsUnsafe.x || attrsUnsafe.y) {
            this.resetCube();
        }

        //set styles based on attributes:
        this.size = attrsUnsafe.size; //FIXME sizes of percent are not valid, e.g., '50%', however px, rem, em, vh, vw all work
        if(this.size) {
            const linkEl = this.shadowRoot.querySelector('link');
            const styleEl = this.shadowRoot.querySelector('style') || document.createElement('style');
            styleEl.innerHTML = `.viewport { --size: ${this.size}; }`; //browser sanitizes innerHTML
            linkEl.after(styleEl);
        }
    }

    connectedCallback() {
        //update standardized el attributes in the dom:
        this.id = `live-cube-${this.count}`;

        //load styles (repeated loads optimized by browser):
        const linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'stylesheet');
        linkEl.setAttribute('href', 'live-cube.css');
        this.shadowRoot.appendChild(linkEl);

        //build cube:
        this.viewportEl = document.createElement('div');
        this.viewportEl.setAttribute('class', 'viewport');
        this.cubeEl = document.createElement('div');
        this.cubeEl.setAttribute('class', 'cube');
        let numSides = 6;
        while(numSides--) {
            const sideEl = document.createElement('div');
            let numTiles = 9;
            while(numTiles--) {
                const tileEl = document.createElement('div');
                sideEl.appendChild(tileEl);
            }
            this.cubeEl.appendChild(sideEl);
        }
        this.viewportEl.appendChild(this.cubeEl);

        //set event listeners:
        this.controller = new AbortController();
        // document.addEventListener('mouseup', (e) => this.resetCube(e), { signal: this.controller.signal }); //works but disabled //TODO add a toggle attribute for this feature 'reset-on-release'
        document.addEventListener('keydown', (e) => this.doMoves[e.code] && this.doMoves[e.code](), { signal: this.controller.signal });
        this.viewportEl.addEventListener('spin-cube', (e) => this.spinCube(e));
        this.cubeEl.addEventListener('mousedown', (e) => this.clickOrTouchAction(e));
        this.cubeEl.addEventListener('touchstart', (e) => this.clickOrTouchAction(e));

        //insert cube into dom:
        this.shadowRoot.appendChild(this.viewportEl);

        if(this.#firstRun) {
            this.#firstRun = false;
            this.repaint();
        }
        this.resetCube();
    }

    disconnectedCallback() {
        //TODO remove document listers like keydown
        this.controller.abort();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(this.#firstRun) {
            return; //break out
        }
        console.log(`Attribute ${name} has changed (${oldValue}, ${newValue}).`);
        this.repaint();
    }

    move(newCoords, isTouch) {
        if(newCoords) {
            if(typeof newCoords.x === 'number') this.x = newCoords.x;
            if(typeof newCoords.y === 'number') this.y = newCoords.y;
        }
        this.cubeEl.style.transform = 'rotateX(' + this.x + 'deg) rotateY(' + this.y + 'deg)';
        // speed up transitions for touches:
        this.cubeEl.style.transitionDuration = isTouch ? '50ms' : '500ms';
    }

    doMoves = {
        ArrowLeft: () => this.move({ y: this.y - 90 }),
        ArrowUp: () => this.move({ x: this.x + 90 }),
        ArrowRight: () => this.move({ y: this.y + 90 }),
        ArrowDown: () => this.move({ x: this.x - 90 }),
        Escape: () => this.resetCube(),
    };

    resetCube() {
        this.move({ x: this.xReset, y: this.yReset }); //MJB this is a generic 'home' position //TODO use the 'home' position for each pattern
    }

    spinCube(e) {

        function getIsForward(v1, v2) {
            const isForward = v1 >= v2;
            return isForward;
        }

        if(!this.moveCoords.last) {
            this.moveCoords.last = this.moveCoords.start;
        } else {
            if(getIsForward(this.moveCoords.start.x, this.moveCoords.last.x) != getIsForward(this.moveCoords.last.x, e.detail.x)) {
                this.moveCoords.start.x = this.moveCoords.last.x;
            }
            if(getIsForward(this.moveCoords.start.y, this.moveCoords.last.y) != getIsForward(this.moveCoords.last.y, e.detail.y)) {
                this.moveCoords.start.y = this.moveCoords.last.y;
            }
        }
        const movementScaleFactor = e.detail.isTouch ? 3 : 1;
        this.move({
            x: this.x + parseInt((this.moveCoords.start.y - e.detail.y) / movementScaleFactor),
            y: this.y - parseInt((this.moveCoords.start.x - e.detail.x) / movementScaleFactor),
        }, e.detail.isTouch);
        this.moveCoords.last.x = e.detail.x;
        this.moveCoords.last.y = e.detail.y;
    }

    clickOrTouchAction(e) {
        delete this.moveCoords.last;
        if(e.targetTouches) {
            // get touch coords:
            e = e.targetTouches[0];
        }
        this.moveCoords.start.x = e.pageX;
        this.moveCoords.start.y = e.pageY;

        const that = this;
        function dragAction(event) {
            event.preventDefault();

            // only rotate if single finger touch or mouse (still scale with pinch and zoom):
            let isTouch = false;
            if(event.targetTouches && event.targetTouches.length === 1) {
                // get touch coords:
                event = event.targetTouches[0];
                isTouch = true;
            }
            const eventSpinCube = new CustomEvent('spin-cube', {
                bubbles: true,
                detail: { x: event.pageX, y: event.pageY, isTouch: isTouch },
            });
            that.viewportEl.dispatchEvent(eventSpinCube);
        }
        document.addEventListener('mousemove', dragAction);
        document.addEventListener('touchmove', dragAction, { passive: false });

        function unbindDragAction() {
            document.removeEventListener('mousemove', dragAction);
            document.removeEventListener('touchmove', dragAction, { passive: false });
        }
        document.addEventListener('mouseup', unbindDragAction);
        document.addEventListener('touchend', unbindDragAction, { passive: false });
    }

}
customElements.define('live-cube', LiveCube);


// inspired by https://paulrhayes.com/animated-css3-cube-interface-using-3d-transforms/
