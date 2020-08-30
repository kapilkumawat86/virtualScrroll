import * as React from "react";
import "./styles.css";
import { VirtualScollerSettings, VirtualScoller } from "./VirtualScroller";

const SETTINGS: VirtualScollerSettings = {
  minIndex: 1,
  maxIndex: 16,
  startIndex: 1,
  itemHeight: 20,
  amount: 5,
  tolerance: 2
};

interface Data {
  index: number;
  text: string;
}

const getData = (offset: number, limit: number): Data[] => {
  const data = [];
  const start = Math.max(SETTINGS.minIndex, offset);
  const end = Math.min(offset + limit - 1, SETTINGS.maxIndex);
  if (start <= end) {
    for (let i = start; i <= end; i++) {
      data.push({ index: i, text: `item ${i}` });
    }
  }
  return data;
};

const rowTemplate = (item: Data) => (
  <div className="item" key={item.index}>
    {item.text}
  </div>
);

export default function App() {
  return (
    <div className="App">
      <h1>Hello Virtual Scroll</h1>
      <VirtualScoller<Data>
        settings={SETTINGS}
        getData={getData}
        row={rowTemplate}
      />
    </div>
  );
}
