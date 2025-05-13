import { useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getProjectPdfUrl } from "@/lib/api";

const QRCodePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [visible, setVisible] = useState(false);
  const pdfUrl = getProjectPdfUrl(projectId!);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        QR Code pour le PDF du projet
      </h1>
      <button
        onClick={() => setVisible(true)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Générer QR Code
      </button>

      {visible && (
        <div className="mt-6 flex flex-col items-center">
          {/* QR Code */}
          <QRCodeSVG value={pdfUrl} size={256} />

          {/* Instruction */}
          <p className="mt-4 text-gray-700">
            Scannez ce code pour télécharger le PDF
          </p>

          {/* Lien direct de téléchargement */}
         {/* <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-blue-600 hover:underline"
          >
            Télécharger directement le PDF
      </a>*/}
        </div>
      )}
    </div>
  );
};

export default QRCodePage;
