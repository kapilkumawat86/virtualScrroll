import React from "react";
import * as Yup from "yup";

export interface VirtualScollerSettings {
  minIndex: number;
  maxIndex: number;
  startIndex: number;
  itemHeight: number;
  amount: number;
  tolerance: number;
}

const schema = Yup.object().shape({
  minIndex: Yup.number().min(1).required(),
  maxIndex: Yup.number()
    .required()
    .when("minIndex", (minIndex: number, schema: Yup.NumberSchema) => {
      return schema.min(minIndex);
    }),
  startIndex: Yup.number()
    .required()
    .when(
      ["minIndex", "maxIndex"],
      (minIndex: number, maxIndex: number, schema: Yup.NumberSchema) => {
        return schema.min(minIndex).max(maxIndex);
      }
    ),
  itemHeight: Yup.number().required(),
  amount: Yup.number()
    .required()
    .min(1)
    .when(
      ["minIndex", "maxIndex"],
      (minIndex: number, maxIndex: number, schema: Yup.NumberSchema) => {
        return schema.max(maxIndex - minIndex + 1);
      }
    ),
  tolerance: Yup.number()
    .required()
    .min(0)
    .when(
      ["minIndex", "maxIndex", "amount"],
      (
        minIndex: number,
        maxIndex: number,
        amount: number,
        schema: Yup.NumberSchema
      ) => {
        return schema.max(Math.floor((maxIndex - minIndex - amount + 1) / 2));
      }
    )
});

interface VirtualScollerState<T = {}> {
  settings: VirtualScollerSettings;
  viewportHeight: number;
  totalHeight: number;
  toleranceHeight: number;
  bufferHeight: number;
  bufferedItems: number;
  topPaddingHeight: number;
  bottomPaddingHeight: number;
  initialPosition: number;
  data: T[];
}

function setInitialState<T = {}>(
  settings: VirtualScollerSettings
): VirtualScollerState<T> {
  const {
    minIndex,
    maxIndex,
    startIndex,
    itemHeight,
    amount,
    tolerance
  } = settings;
  // 1) height of the visible part of the viewport (px)
  const viewportHeight = amount * itemHeight;
  // 2) total height of rendered and virtualized items (px)
  const totalHeight = (maxIndex - minIndex + 1) * itemHeight;
  // 3) single viewport outlet height, filled with rendered but invisible rows (px)
  const toleranceHeight = tolerance * itemHeight;
  // 4) all rendered rows height, visible part + invisible outlets (px)
  const bufferHeight = viewportHeight + 2 * toleranceHeight;
  // 5) number of items to be rendered, buffered dataset length (pcs)
  const bufferedItems = amount + 2 * tolerance;
  // 6) how many items will be virtualized above (pcs)
  const itemsAbove = startIndex - tolerance - minIndex;
  // 7) initial height of the top padding element (px)
  const topPaddingHeight = itemsAbove * itemHeight;
  // 8) initial height of the bottom padding element (px)
  const bottomPaddingHeight = totalHeight - topPaddingHeight;
  // 9) initial scroll position (px)
  const initialPosition = topPaddingHeight + toleranceHeight;
  // initial state object
  return {
    settings,
    viewportHeight,
    totalHeight,
    toleranceHeight,
    bufferHeight,
    bufferedItems,
    topPaddingHeight,
    bottomPaddingHeight,
    initialPosition,
    data: []
  };
}

export interface VirtualScollerProps<T = {}> {
  settings: VirtualScollerSettings;
  getData: (offset: number, limit: number) => T[];
  row: (item: T) => JSX.Element;
}

export function VirtualScoller<T = {}>({
  settings,
  row,
  getData
}: VirtualScollerProps<T>) {
  React.useEffect(() => {
    schema.validate(settings);
    setState(setInitialState(settings));
  }, [settings]);

  const [state, setState] = React.useState<VirtualScollerState<T>>(
    setInitialState(settings)
  );

  const runScroller = React.useCallback(
    ({
      currentTarget: { scrollTop }
    }: React.SyntheticEvent<HTMLDivElement>) => {
      const {
        totalHeight,
        toleranceHeight,
        bufferedItems,
        settings: { itemHeight, minIndex }
      } = state;
      const index =
        minIndex + Math.floor((scrollTop - toleranceHeight) / itemHeight);
      const data = getData(index, bufferedItems);
      const topPaddingHeight = Math.max((index - minIndex) * itemHeight, 0);
      const bottomPaddingHeight = Math.max(
        totalHeight - topPaddingHeight - data.length * itemHeight,
        0
      );

      setState((prev) => ({
        ...prev,
        topPaddingHeight,
        bottomPaddingHeight,
        data
      }));
    },
    [state, getData]
  );

  const viewportElement = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (viewportElement && viewportElement.current) {
      viewportElement.current.scrollTop = state.initialPosition;
      if (!state.initialPosition) {
        runScroller({ currentTarget: { scrollTop: 0 } } as any);
      }
    }
  }, []);

  const { viewportHeight, topPaddingHeight, bottomPaddingHeight, data } = state;
  return (
    <div
      ref={viewportElement}
      className="viewport"
      onScroll={runScroller}
      style={{ height: viewportHeight }}
    >
      <div style={{ height: topPaddingHeight }}></div>
      {data.map(row)}
      <div style={{ height: bottomPaddingHeight }}></div>
    </div>
  );
}
