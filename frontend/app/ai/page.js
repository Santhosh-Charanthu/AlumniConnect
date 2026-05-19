"use client";

import { useState, useEffect } from "react";

export default function GetSuitableAlumni() {
  const callBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/matched-alumni`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        console.log("Called Backend");
      } else {
        console.log("Failed to call Backend");
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      <button onClick={callBackend}>Get Matched Alumni</button>
    </>
  );
}
