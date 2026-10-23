import { searchPlaces } from '../api';
import type { Place } from '../types';
import { debounce } from './dom';
import { renderSuggestions } from './render';

interface SearchOptions {
  input: HTMLInputElement;
  list: HTMLElement;
  form: HTMLFormElement;
  onSelect: (place: Place) => void;
  onError: (message: string) => void;
}

/** Accessible combobox (WAI-ARIA 1.2 pattern) backed by Open-Meteo geocoding. */
export function setupSearch({ input, list, form, onSelect, onError }: SearchOptions): void {
  let results: Place[] = [];
  let activeIndex = -1;
  let controller: AbortController | undefined;
  let lastQuery = '';

  const setExpanded = (open: boolean): void => {
    input.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    if (!open) input.removeAttribute('aria-activedescendant');
  };

  const draw = (): void => {
    if (!results.length) {
      list.innerHTML =
        lastQuery.length >= 2 ? '<li class="suggestion is-empty" role="presentation">No places found</li>' : '';
      setExpanded(lastQuery.length >= 2);
      return;
    }
    list.innerHTML = renderSuggestions(results, activeIndex);
    setExpanded(true);
    if (activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `suggestion-${activeIndex}`);
      list.querySelector(`#suggestion-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const close = (): void => {
    controller?.abort();
    activeIndex = -1;
    setExpanded(false);
  };

  const choose = (index: number): void => {
    const place = results[index];
    if (!place) return;
    input.value = '';
    results = [];
    lastQuery = '';
    close();
    input.blur();
    onSelect(place);
  };

  const lookup = debounce(async (query: string) => {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    form.classList.add('is-loading');
    try {
      const found = await searchPlaces(query, signal);
      if (signal.aborted) return;
      results = found;
      activeIndex = found.length ? 0 : -1;
      draw();
    } catch (error) {
      if (signal.aborted) return;
      results = [];
      close();
      onError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      if (!signal.aborted) form.classList.remove('is-loading');
    }
  }, 250);

  input.addEventListener('input', () => {
    lastQuery = input.value.trim();
    if (lastQuery.length < 2) {
      results = [];
      form.classList.remove('is-loading');
      close();
      return;
    }
    lookup(lastQuery);
  });

  input.addEventListener('keydown', (event) => {
    const open = !list.hidden && results.length > 0;
    switch (event.key) {
      case 'ArrowDown':
        if (!open) return;
        event.preventDefault();
        activeIndex = (activeIndex + 1) % results.length;
        draw();
        break;
      case 'ArrowUp':
        if (!open) return;
        event.preventDefault();
        activeIndex = (activeIndex - 1 + results.length) % results.length;
        draw();
        break;
      case 'Escape':
        if (!list.hidden) {
          event.preventDefault();
          close();
        } else {
          input.value = '';
        }
        break;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (results.length) {
      choose(Math.max(activeIndex, 0));
      return;
    }
    const query = input.value.trim();
    if (query.length < 2) return;
    // Enter pressed before the debounced lookup finished: search immediately.
    try {
      results = await searchPlaces(query);
      if (results.length) choose(0);
      else {
        lastQuery = query;
        draw();
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Search failed.');
    }
  });

  // pointerdown fires before the input's blur, so the click is not lost.
  list.addEventListener('pointerdown', (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (!item) return;
    event.preventDefault();
    choose(Number(item.dataset.index));
  });

  input.addEventListener('blur', () => {
    setTimeout(close, 120);
  });

  input.addEventListener('focus', () => {
    if (results.length) draw();
  });

  // "/" focuses the search box, like many sites.
  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !/INPUT|TEXTAREA|SELECT/.test(target.tagName)) {
      event.preventDefault();
      input.focus();
    }
  });
}
