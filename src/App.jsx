// App.jsx

import React, { useState, useRef, useEffect } from "react";
import { Range } from "react-range";
import html2canvas from "html2canvas";
import { FaTwitter, FaFacebookF, FaDownload } from "react-icons/fa";
import backgroundImg from "./assets/background.png";
import "./index.css";

function DualRangeSlider({ label, values, onChange, min, max, step = 1, formatRangeValue, formatThumbValue }) {
  const rangeFormatter = formatRangeValue || (([a, b]) => `${a} - ${b}`);
  const thumbFormatter = formatThumbValue || (val => val);

  const renderThumb = ({ props, value }) => (
    <div {...props} className="range-thumb">
      <div className="range-tooltip">{thumbFormatter(value)}</div>
    </div>
  );

  return (
    <div className="filter-group">
      <label>{label}</label>
      <div className="range-row">
        <Range
          values={values}
          step={step}
          min={min}
          max={max}
          onChange={onChange}
          renderTrack={({ props, children }) => (
            <div {...props} className="range-rail" style={props.style}>
              <div
                className="range-track"
                style={{
                  left: `${((Math.min(values[0], values[1]) - min) / (max - min)) * 100}%`,
                  width: `${(Math.abs(values[1] - values[0]) / (max - min)) * 100}%`
                }}
              />
              {children}
            </div>
          )}
          renderThumb={({ props, value }) => renderThumb({ props, value })}
        />
      </div>
    </div>
  );
}

function SingleRangeSlider({ label, value, onChange, min, max, step = 1, formatSliderValue, formatThumbValue }) {
  const sliderFormatter = formatSliderValue || (val => val);
  const thumbFormatter = formatThumbValue || (val => val);

  const renderThumb = ({ props, value }) => (
    <div {...props} className="range-thumb">
      <div className="range-tooltip">{thumbFormatter(value)}</div>
    </div>
  );

  return (
    <div className="filter-group">
      <label>{label}</label>
      <div className="range-row">
        <Range
          values={[value]}
          step={step}
          min={min}
          max={max}
          onChange={vals => onChange(vals[0])}
          renderTrack={({ props, children }) => (
            <div {...props} className="range-rail" style={props.style}>
              <div
                className="range-track"
                style={{
                  width: `${((value - min) / (max - min)) * 100}%`
                }}
              />
              {children}
            </div>
          )}
          renderThumb={({ props, value }) => renderThumb({ props, value })}
        />
      </div>
    </div>
  );
}

function MultiCheckboxDropdown({ label, options, selectedValues, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedCount = selectedValues.length;
  const summary =
    selectedCount === 0
      ? "Select..."
      : selectedCount === 1
        ? options.find(o => o.value === selectedValues[0])?.label
        : selectedValues
          .map(v => options.find(o => o.value === v)?.label)
          .slice(0, 2)
          .join(", ") + (selectedCount > 2 ? ` + ${selectedCount - 2}` : "");

  function toggleItem(value) {
    const alreadySelected = selectedValues.includes(value);
    let newVals;

    if (value === "any") {
      if (alreadySelected) {
        newVals = [];
      } else {
        newVals = ["any"];
      }
    } else {
      if (alreadySelected) {
        newVals = selectedValues.filter(x => x !== value);
      } else {
        newVals = selectedValues.filter(x => x !== "any").concat(value);
      }
    }
    onChange(newVals);
  }

  return (
    <div ref={containerRef} className="multi-dropdown">
      <label>{label}</label>
      <div className="multi-dropdown-control" onClick={() => setOpen(!open)}>
        <span>{summary}</span>
        <div className="arrow">{open ? "▲" : "▼"}</div>
      </div>
      {open && (
        <div className="multi-dropdown-menu">
          {options.map(o => {
            const checked = selectedValues.includes(o.value);
            return (
              <label key={o.value} className="multi-dropdown-item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(o.value)}
                />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [preferences, setPreferences] = useState({
    gender: "Men",
    ageRange: [25, 45],
    heightRange: [68, 77],
    minIncome: 70000,
    ethnicity: [],
    education: [],
    eyeColor: [],
    hairColor: [],
    religion: [],
    smokes: "No",
    drinks: "Either",
    drugs: "Either",
    excludeMarried: true,
    excludeObese: true
  });

  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState(0);
  const shareRef = useRef(null);

  const BOSTON_POPULATION = 653833;

  function formatRangeArray([low, high]) {
    return `${low} - ${high}`;
  }
  function formatRangeThumb(val) {
    return String(val);
  }
  function formatHeightInches(num) {
    const ft = Math.floor(num / 12);
    const r = num % 12;
    return `${ft}'${r}"`;
  }
  function formatHeightRange([low, high]) {
    return `${formatHeightInches(low)} - ${formatHeightInches(high)}`;
  }

  function calculateMatch() {
    let probability = 100;
    probability *= preferences.gender === "Women" ? 0.519 : 0.481;
    const ageWidth = Math.abs(preferences.ageRange[1] - preferences.ageRange[0]);
    probability *= Math.min(ageWidth / 62, 1);
    const hRange = Math.abs(preferences.heightRange[1] - preferences.heightRange[0]);
    probability *= Math.min(hRange / (4 * 2.7), 1);
    if (preferences.ethnicity.length > 0 && !preferences.ethnicity.includes("any")) {
      const eStats = {
        white: 0.478,
        black: 0.215,
        asian: 0.1,
        hispanic: 0.189,
        native: 0.003,
        pacific: 0.001
      };
      let sumE = 0;
      preferences.ethnicity.forEach(e => {
        sumE += eStats[e] || 0.01;
      });
      probability *= Math.min(sumE, 1);
    }
    if (preferences.minIncome >= 150000) probability *= 0.15;
    else if (preferences.minIncome >= 100000) probability *= 0.35;
    else if (preferences.minIncome >= 70000) probability *= 0.55;
    if (preferences.education.length > 0 && !preferences.education.includes("any")) {
      const eduStats = {
        high_school: 0.889,
        some_college: 0.64,
        bachelors: 0.541,
        masters: 0.24,
        doctorate: 0.05
      };
      let sumEdu = 0;
      preferences.education.forEach(e => {
        sumEdu += eduStats[e] || 0.15;
      });
      probability *= Math.min(sumEdu, 1);
    }
    if (preferences.eyeColor.length > 0 && !preferences.eyeColor.includes("any")) {
      const eyeStats = {
        brown: 0.45,
        blue: 0.27,
        hazel: 0.18,
        green: 0.09
      };
      let sumEye = 0;
      preferences.eyeColor.forEach(ec => {
        sumEye += eyeStats[ec] || 0.01;
      });
      probability *= Math.min(sumEye, 1);
    }
    if (preferences.hairColor.length > 0 && !preferences.hairColor.includes("any")) {
      const hairStats = {
        black: 0.85,
        brown: 0.11,
        blonde: 0.02,
        red: 0.01
      };
      let sumHair = 0;
      preferences.hairColor.forEach(h => {
        sumHair += hairStats[h] || 0.01;
      });
      probability *= Math.min(sumHair, 1);
    }
    if (preferences.religion.length > 0 && !preferences.religion.includes("any")) {
      const rStats = {
        non_religious: 0.35,
        christian: 0.595,
        jewish: 0.01,
        islamic: 0.015,
        hindu: 0.01,
        other: 0.025
      };
      let sumR = 0;
      preferences.religion.forEach(r => {
        sumR += rStats[r] || 1;
      });
      probability *= Math.min(sumR, 1);
    }
    if (preferences.smokes === "No") {
      probability *= preferences.gender === "Men" ? 0.88 : 0.9;
    } else if (preferences.smokes === "Yes") {
      probability *= preferences.gender === "Men" ? 0.12 : 0.1;
    }
    if (preferences.drinks === "Yes") {
      probability *= preferences.gender === "Men" ? 0.56 : 0.48;
    } else if (preferences.drinks === "No") {
      probability *= preferences.gender === "Men" ? 0.44 : 0.52;
    }
    if (preferences.drugs === "Yes") {
      probability *= preferences.gender === "Men" ? 0.125 : 0.08;
    } else if (preferences.drugs === "No") {
      probability *= preferences.gender === "Men" ? 0.875 : 0.92;
    }
    if (preferences.excludeMarried) probability *= 0.65;
    if (preferences.excludeObese) probability *= 0.78;
    let matchingPeople = Math.round(BOSTON_POPULATION * (probability / 100));
    if (matchingPeople <= 0) matchingPeople = 1;
    const finalProb = Math.max(0, Math.min(probability, 100)).toFixed(2);
    setResult({ percentage: finalProb, people: matchingPeople.toLocaleString() });
    setMatches(matchingPeople);
  }

  async function handleDownloadImage() {
    if (!shareRef.current) return;
    const canvas = await html2canvas(shareRef.current);
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "lola-share.png";
    link.click();
  }

  function handleShareTwitter() {
    if (!result) return;
    const singular = parseInt(result.people.replace(/,/g, ""), 10) === 1;
    const textBlock = singular
      ? `Fun fact: @LolaDating says there is only 1 person in Boston who meets my standards!😂\nWant to know yours? Visit lola.com/demo`
      : `Fun fact: @LolaDating says there are ${result.people} people in Boston who meet my standards!😂\nWant to know yours? Visit lola.com/demo`;
    const tweet = encodeURIComponent(textBlock);
    const url = `https://twitter.com/intent/tweet?text=${tweet}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleShareFacebook() {
    if (!result) return;
    const singular = parseInt(result.people.replace(/,/g, ""), 10) === 1;
    const textBlock = singular
      ? `Fun fact: @LolaDating says there is only 1 person in Boston who meets my standards!😂\nWant to know yours? Visit lola.com/demo`
      : `Fun fact: @LolaDating says there are ${result.people} people in Boston who meet my standards!😂\nWant to know yours? Visit lola.com/demo`;
    const fbText = encodeURIComponent(textBlock);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${fbText}&u=https://lola.com/demo`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
  }

  const ethnicityOptions = [
    { value: "any", label: "Any" },
    { value: "white", label: "White" },
    { value: "black", label: "Black" },
    { value: "asian", label: "Asian" },
    { value: "hispanic", label: "Hispanic or Latino" },
    { value: "native", label: "American Indian" },
    { value: "pacific", label: "Pacific Islander" }
  ];
  const educationOptions = [
    { value: "any", label: "Any" },
    { value: "high_school", label: "High School Graduate" },
    { value: "some_college", label: "Some College" },
    { value: "bachelors", label: "Bachelor's Degree" },
    { value: "masters", label: "Master's Degree" },
    { value: "doctorate", label: "Doctorate" }
  ];
  const eyeColorOptions = [
    { value: "any", label: "Any" },
    { value: "brown", label: "Brown" },
    { value: "blue", label: "Blue" },
    { value: "hazel", label: "Hazel" },
    { value: "green", label: "Green" }
  ];
  const hairColorOptions = [
    { value: "any", label: "Any" },
    { value: "black", label: "Black Hair" },
    { value: "brown", label: "Brown Hair" },
    { value: "blonde", label: "Blonde Hair" },
    { value: "red", label: "Red Hair" }
  ];
  const religionOptions = [
    { value: "any", label: "Any" },
    { value: "non_religious", label: "Non-religious" },
    { value: "christian", label: "Christian" },
    { value: "jewish", label: "Jewish" },
    { value: "islamic", label: "Islamic" },
    { value: "hindu", label: "Hinduism" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="container">
      <h1 className="title">Find your match in Boston</h1>
      <p className="subtitle">Let's find out who's available</p>

      <div className="card">
        <div className="filter-group">
          <label>Gender</label>
          <div className="button-group">
            {["Men", "Women"].map(g => (
              <button
                key={g}
                className={`button ${preferences.gender === g ? "active" : ""}`}
                onClick={() => setPreferences({ ...preferences, gender: g })}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <DualRangeSlider
          label="Age"
          values={preferences.ageRange}
          onChange={vals => setPreferences({ ...preferences, ageRange: vals })}
          min={18}
          max={80}
          step={1}
          formatRangeValue={formatRangeArray}
          formatThumbValue={formatRangeThumb}
        />

        <DualRangeSlider
          label="Height"
          values={preferences.heightRange}
          onChange={vals => setPreferences({ ...preferences, heightRange: vals })}
          min={60}
          max={84}
          step={1}
          formatRangeValue={formatHeightRange}
          formatThumbValue={formatHeightInches}
        />

        <SingleRangeSlider
          label="Minimum Income"
          value={preferences.minIncome}
          onChange={val => setPreferences({ ...preferences, minIncome: val })}
          min={0}
          max={300000}
          step={5000}
          formatSliderValue={v => `$${v.toLocaleString()}`}
          formatThumbValue={v => `$${v.toLocaleString()}`}
        />

        <MultiCheckboxDropdown
          label="Ethnicity"
          options={ethnicityOptions}
          selectedValues={preferences.ethnicity}
          onChange={newVals => setPreferences({ ...preferences, ethnicity: newVals })}
        />

        <MultiCheckboxDropdown
          label="Education"
          options={educationOptions}
          selectedValues={preferences.education}
          onChange={newVals => setPreferences({ ...preferences, education: newVals })}
        />

        <MultiCheckboxDropdown
          label="Eye Color"
          options={eyeColorOptions}
          selectedValues={preferences.eyeColor}
          onChange={newVals => setPreferences({ ...preferences, eyeColor: newVals })}
        />

        <MultiCheckboxDropdown
          label="Hair Color"
          options={hairColorOptions}
          selectedValues={preferences.hairColor}
          onChange={newVals => setPreferences({ ...preferences, hairColor: newVals })}
        />

        <MultiCheckboxDropdown
          label="Religion"
          options={religionOptions}
          selectedValues={preferences.religion}
          onChange={newVals => setPreferences({ ...preferences, religion: newVals })}
        />

        <div className="filter-group">
          <label>Smokes</label>
          <div className="button-group">
            {["Either", "Yes", "No"].map(opt => (
              <button
                key={opt}
                className={`button ${preferences.smokes === opt ? "active" : ""}`}
                onClick={() => setPreferences({ ...preferences, smokes: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Drinks</label>
          <div className="button-group">
            {["Either", "Yes", "No"].map(opt => (
              <button
                key={opt}
                className={`button ${preferences.drinks === opt ? "active" : ""}`}
                onClick={() => setPreferences({ ...preferences, drinks: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Drugs</label>
          <div className="button-group">
            {["Either", "Yes", "No"].map(opt => (
              <button
                key={opt}
                className={`button ${preferences.drugs === opt ? "active" : ""}`}
                onClick={() => setPreferences({ ...preferences, drugs: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {[
          ["Exclude Married", "excludeMarried"],
          ["Exclude Obese", "excludeObese"]
        ].map(([lbl, prefKey]) => (
          <div key={prefKey} className="filter-group">
            <label>{lbl}</label>
            <div className="button-group">
              {["Yes", "No"].map(option => {
                const boolVal = option === "Yes";
                return (
                  <button
                    key={option}
                    className={`button ${preferences[prefKey] === boolVal ? "active" : ""}`}
                    onClick={() => setPreferences({ ...preferences, [prefKey]: boolVal })}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button className="calculate-button" onClick={calculateMatch}>
          Let's Find Out
        </button>

        {/* Remove repeated # from card: only display the % if you want. */}
        {result && (
          <div className="result">
            <h2 className="result-value">{result.percentage}%</h2>
          </div>
        )}
      </div>

      {result && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <div
            ref={shareRef}
            className="share-container"
            style={{
              width: "600px",
              height: "600px",
              margin: "1rem auto",
              position: "relative",
              background: `url(${backgroundImg}) center center / cover no-repeat`,
              borderRadius: "16px",
              overflow: "hidden"
            }}
          >
            <div className="overlay-content">
              <div className="overlay-big-number">{matches.toLocaleString()}</div>
              <div className="overlay-subtitle">
                {parseInt(result.people.replace(/,/g, ""), 10) === 1
                  ? "1 person in Boston match my dating criteria"
                  : `people in Boston match my dating criteria`}
              </div>
              <div className="overlay-cta">
                Want to know yours?
                <br />
                Visit lola.com/demo
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button className="button" onClick={handleDownloadImage}>
              <FaDownload style={{ marginRight: "6px" }} />
              Download
            </button>
            <button className="button" onClick={handleShareTwitter}>
              <FaTwitter style={{ marginRight: "6px" }} />
              Twitter
            </button>
            <button className="button" onClick={handleShareFacebook}>
              <FaFacebookF style={{ marginRight: "6px" }} />
              Facebook
            </button>
          </div>

          <div className="disclaimer">
            Life's beautiful chaos doesn't fit in checkboxes. This tool is just for fun —
            the best connections often come when we let go of our carefully crafted lists
            and let real chemistry take the lead.
          </div>
          <p className="footer">
            Calculated with US Census Bureau data (2023) and approximate assumptions
          </p>
        </div>
      )}
    </div>
  );
}
