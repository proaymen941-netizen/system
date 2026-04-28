window.posKeyboard = {
    _ref: null,
    _handler: null,
    attach: function (dotnetRef) {
        this.detach();
        this._ref = dotnetRef;
        this._handler = (ev) => {
            // Don't intercept while typing inside input/textarea/select
            const tag = (ev.target && ev.target.tagName || '').toUpperCase();
            const editable = ev.target && ev.target.isContentEditable;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;

            let key = ev.key;
            // Map keys we care about
            if (/^[0-9]$/.test(key)) {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnDigit', key);
            } else if (key === 'Enter') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnEnter');
            } else if (key === 'Backspace') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnBackspace');
            } else if (key === 'Escape') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnEscape');
            } else if (key === 'ArrowRight') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnArrow', 'right');
            } else if (key === 'ArrowLeft') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnArrow', 'left');
            } else if (key === 'ArrowUp') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnArrow', 'up');
            } else if (key === 'ArrowDown') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnArrow', 'down');
            } else if (key === 'Delete') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnDelete');
            } else if (key === '+' || key === '=') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnPlus');
            } else if (key === '-' || key === '_') {
                ev.preventDefault();
                dotnetRef.invokeMethodAsync('OnMinus');
            }
        };
        document.addEventListener('keydown', this._handler);
    },
    detach: function () {
        if (this._handler) {
            document.removeEventListener('keydown', this._handler);
            this._handler = null;
            this._ref = null;
        }
    }
};
