import "./Loader.css";

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="loader-wrap">
      <div className="loader-spinner" />
      <p className="loader-text">{text}</p>
    </div>
  );
}
