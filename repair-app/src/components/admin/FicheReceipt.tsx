import React from "react";
import qr from "../GenerateQr";

interface FicheReceiptProps {
  fiche: any;
  client: string;
  marque: string;
  typeProduit: string;
  technicien: string;
  nom_atelier: string;
}

const FicheReceipt = React.forwardRef<HTMLDivElement, FicheReceiptProps>(
  ({ fiche, client, marque, typeProduit, technicien, nom_atelier }, ref) => (
    <div
      ref={ref}
      className="receipt-ticket"
      style={{
        width: 320,
        padding: 20,
        fontFamily: "'Courier New', monospace",
        background: "#ffffff",
        fontSize: 13,
        lineHeight: 1.4,
        color: "#000",
        border: "1px solid #ddd",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        margin: "0 auto",
      }}
    >
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ 
          fontSize: 16, 
          fontWeight: "bold", 
          margin: "0 0 8px 0",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          {nom_atelier}
        </h1>
        <div style={{ 
          fontSize: 11, 
          color: "#666",
          marginBottom: 12
        }}>
          TICKET DE RÉPARATION
        </div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginBottom: 12 
        }}>
          <img
            src={qr(fiche.code_barre)}
            alt="QR Code"
            style={{ 
              width: 70, 
              height: 70,
              border: "1px solid #ddd",
              padding: 2
            }}
          />
        </div>
        
        <div style={{ 
          fontSize: 12, 
          fontWeight: "bold",
          padding: "4px 8px",
          backgroundColor: "#f5f5f5",
          border: "1px solid #ddd",
          display: "inline-block",
          marginBottom: 12
        }}>
          CODE: {fiche.code_barre}
        </div>
      </div>

      {/* Separator */}
      <div style={{ 
        borderTop: "2px solid #000", 
        margin: "12px 0" 
      }}></div>

      {/* Client Information */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: "bold", 
          margin: "0 0 8px 0",
          textTransform: "uppercase",
          borderBottom: "1px solid #ccc",
          paddingBottom: 2
        }}>
          INFORMATIONS CLIENT
        </h3>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Client:</span>
            <span>{client}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Téléphone:</span>
            <span>{fiche.telephone}</span>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: "bold", 
          margin: "0 0 8px 0",
          textTransform: "uppercase",
          borderBottom: "1px solid #ccc",
          paddingBottom: 2
        }}>
          PRODUIT
        </h3>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Marque:</span>
            <span>{marque}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Modèle:</span>
            <span>{fiche.modele}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Type:</span>
            <span>{typeProduit}</span>
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: "bold", 
          margin: "0 0 8px 0",
          textTransform: "uppercase",
          borderBottom: "1px solid #ccc",
          paddingBottom: 2
        }}>
          SERVICE
        </h3>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Technicien:</span>
            <span>{technicien}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontWeight: "bold", marginBottom: 2 }}>Diagnostic:</div>
            <div style={{ 
              fontSize: 11, 
              backgroundColor: "#f9f9f9", 
              padding: 6,
              border: "1px solid #eee",
              borderRadius: 2
            }}>
              {fiche.diagnostic}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>État:</span>
            <span style={{ 
              backgroundColor: fiche.etat === 'Terminé' ? '#e8f5e8' : '#fff3cd',
              padding: '2px 6px',
              borderRadius: 2,
              fontSize: 11
            }}>
              {fiche.etat}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: "bold", 
          margin: "0 0 8px 0",
          textTransform: "uppercase",
          borderBottom: "1px solid #ccc",
          paddingBottom: 2
        }}>
          FACTURATION
        </h3>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Montant Total:</span>
            <span style={{ fontWeight: "bold" }}>{fiche.montant_total?.toFixed(3)} DT</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Montant Payé:</span>
            <span style={{ color: "#28a745" }}>{fiche.montant_paye?.toFixed(3)} DT</span>
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            marginBottom: 3,
            padding: "6px 0",
            borderTop: "1px solid #ddd",
            fontWeight: "bold"
          }}>
            <span>Restant à Payer:</span>
            <span style={{ 
              color: ((fiche.montant_total ?? 0) - (fiche.montant_paye ?? 0)) > 0 ? "#dc3545" : "#28a745"
            }}>
              {((fiche.montant_total ?? 0) - (fiche.montant_paye ?? 0)).toFixed(3)} DT
            </span>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: "bold", 
          margin: "0 0 8px 0",
          textTransform: "uppercase",
          borderBottom: "1px solid #ccc",
          paddingBottom: 2
        }}>
          DATES
        </h3>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Réception:</span>
            <span>{fiche.date_reception}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontWeight: "bold" }}>Enlèvement:</span>
            <span>{fiche.date_enlevement || "À déterminer"}</span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div style={{ 
        borderTop: "2px solid #000", 
        margin: "16px 0" 
      }}></div>

      {/* Footer */}
      <div style={{ 
        textAlign: "center", 
        fontSize: 11,
        lineHeight: 1.4
      }}>
        <div style={{ 
          fontWeight: "bold",
          marginBottom: 8
        }}>
          Merci pour votre confiance!
        </div>
        <div style={{ 
          fontSize: 10,
          color: "#666",
          marginBottom: 4
        }}>
          Gardez ce ticket pour le retrait
        </div>
        <div style={{ 
          fontSize: 10,
          color: "#666"
        }}>
          {new Date().toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
);

export default FicheReceipt;