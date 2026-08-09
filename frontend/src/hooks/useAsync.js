import { useCallback, useEffect, useRef, useState } from 'react';

/** Generic loading/error/data wrapper around any service call, with retry. */
export function useAsync(asyncFn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ status: immediate ? 'loading' : 'idle', data: null, error: null });
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const run = useCallback(async (...args) => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const data = await fnRef.current(...args);
      setState({ status: 'success', data, error: null });
      return data;
    } catch (error) {
      setState({ status: 'error', data: null, error });
      throw error;
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, run, isLoading: state.status === 'loading', isError: state.status === 'error' };
}
