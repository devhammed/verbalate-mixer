import './main.css';
import { StrictMode, useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (!container) {
  throw new Error('No root element found.');
}

const root = createRoot(container);

const App = function () {
  const intervalMsRef = useRef(100);

  const intervalRef = useRef<NodeJS.Timeout | number | null>(null);

  const [state, setState] = useState({
    clipSlice: [
      {
        start: 1.0,
        end: 2.0,
        audio: new Audio('/1sec.mp3'),
      },
      {
        start: 4.0,
        end: 6.0,
        audio: new Audio('/2sec.mp3'),
      },
    ],
    globalPlayHeadPosition: 0.0,
    isPlaying: false,
    trackDuration: 10.0,
    scale: 100,
  });

  const handlePlayState = () => {
    setState((prevState) => ({
      ...prevState,
      isPlaying: !prevState.isPlaying,
    }));
  };

  const handleScaling = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({
      ...prevState,
      scale: e.target.valueAsNumber,
    }));
  };

  const handleSeek = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();

    const x = e.clientX - rect.left;

    const position = x / state.scale;

    setState((prevState) => ({
      ...prevState,
      globalPlayHeadPosition: position,
    }));
  };

  useEffect(() => {
    if (state.isPlaying) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const nextPosition = prev.globalPlayHeadPosition + (intervalMsRef.current / 1000);

          if (nextPosition >= prev.trackDuration) {
            clearInterval(intervalRef.current!);

            intervalRef.current = null;

            prev.clipSlice.forEach((clip) => {
              clip.audio.pause();
              clip.audio.currentTime = 0;
            });

            return { ...prev, globalPlayHeadPosition: 0.0, isPlaying: false };
          }

          prev.clipSlice.forEach((clip) => {
            if (nextPosition >= clip.start && nextPosition <= clip.end) {
              clip.audio.play();
            } else {
              clip.audio.pause();
              clip.audio.currentTime = 0;
            }
          });

          return { ...prev, globalPlayHeadPosition: nextPosition };
        });
      }, intervalMsRef.current);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);

        intervalRef.current = null;
      }

      state.clipSlice.forEach((clip) => {
        clip.audio.pause();
        clip.audio.currentTime = 0;
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isPlaying, state.clipSlice]);

  return (
    <section className="flex flex-col items-center justify-center gap-8 min-h-dvh">
      <button
        type="button"
        onClick={handlePlayState}
        className="bg-red-500 text-white px-2"
      >
        {state.isPlaying ? 'Pause' : 'Play'}
      </button>

      <input type="range" min="50" max="200" step="0.1" value={state.scale} onChange={handleScaling} />

      <div
        onClick={handleSeek}
        className="relative border border-black h-32 w-(--width)"
        style={{ '--width': `${state.scale * state.trackDuration}px` }}
      >
        {state.clipSlice.map((clip, index) => (
          <div
            key={'clip-' + index}
            className="absolute bg-purple-500 h-full w-(--width) left-(--left) pointer-events-none"
            style={{
              '--width': `${state.scale * (clip.end - clip.start)}px`,
              '--left': `${state.scale * clip.start}px`
            }}
          >
          </div>
        ))}

        <div
          className="absolute bg-green-500 h-full w-[1.5px] left-(--left) pointer-events-none"
          style={{
            '--left': `${state.scale * state.globalPlayHeadPosition}px`
          }}
        >
        </div>
      </div>
    </section>
  );
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
