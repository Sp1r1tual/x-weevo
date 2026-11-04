import React from "react";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  // Escaping "<" keeps product text from closing the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
};
