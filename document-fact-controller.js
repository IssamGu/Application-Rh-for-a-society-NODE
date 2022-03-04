const mongoose = require('mongoose')
const User = mongoose.model('User')
const Client = mongoose.model('Client')
const DocumentFact = mongoose.model('documentFact')
var pdfMake = require('pdfmake/build/pdfmake');
var pdfFonts = require('pdfmake/build/vfs_fonts');
const cloudinary = require('cloudinary');
const nodemailer = require ('nodemailer')
const sendGridTransport = require ('nodemailer-sendgrid-transport')
const moment = require('moment')

const transporter = nodemailer.createTransport(sendGridTransport({
    sendMail: true,
    auth: {
        api_key: process.env.apiKey
    }
}))


cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_cloudinary_key,
    api_secret: process.env.api_cloudinary_secret
})

pdfMake.vfs = pdfFonts.pdfMake.vfs

/** get all fact documents */
exports.get_fact_documents = (req, res) => {
    DocumentFact.find()
    .populate("created_by", "nom prenom email")
    .then((result) => {
        res.send(result)
    })
    .catch((error) => {
        console.log(error)
    }) 
}

/** generate fact document */
exports.generate_document_fact = (req, res) => {
    console.log(req.body)
    const {type, description, devise, client_name, total_facture, globaltva_value, subtotal, total_tva, article_table, articles} = req.body
    if (!type | !description, !devise, !client_name) {
        return res.status(422).json({error: "Please add all the fields"})
    }

    Client.find({client_name: client_name})
    .then((result) => {
        const client = result[0].client_name
        const client_adress = result[0].adresse
        const client_ville = result[0].ville
        const client_pays = result[0].pays
        const client_postal = result[0].code_postal
        const client_email = result[0].email
        const client_phone = result[0].numTelephone
        const client_rib = result[0].RIB


        function ArrayToObject(tab){
            let tableau = []
            let obj = {
                border: [false, true, false, true],
                margin: [0, 5, 0, 5],
                fillColor: '#eaf2f5', 
            }
            for(let i=0; i<tab.length; i++){
                obj= {...obj, text: tab[i]}
                tableau= [...tableau,obj]
            }
            return tableau
        }
        function ArrayToObjectSecond(tab){
            let tableau = []
            let obj = {
              border: [false, false, false, true],
              margin: [0, 5, 0, 5],
              
            }
            for(let i=1; i<tab.length; i++){
                if(i!=5){
                    obj= {...obj, text: tab[i]}
                    tableau= [...tableau,obj]
                }else{
                    obj= {...obj, text: tab[i], fillColor: '#f5f5f5'}
                    tableau= [...tableau,obj]
                }
            }
            return tableau
        }
        function buildTableBody(data, columns) {
            var body = [];
        
            body.push(ArrayToObject(columns))  
                data.map(element=>{
            const propertyValues = Object.values(element);
                body.push(ArrayToObjectSecond(propertyValues))
            })
            /*    body.push([{text: dataRow, border: [false, false, false, true],
                    margin: [0, 5, 0, 5],
                    alignment: 'left'}]);*/
        
            return body;
        }
        function table(data, columns) {
            return {
                table: {
                    headerRows: 1,
                    widths: '20%',
                    body: buildTableBody(data, columns),
                },
                layout: {
                    defaultBorder: false,
                    hLineWidth: function(i, node) {
                      return 1;
                    },
                    vLineWidth: function(i, node) {
                      return 1;
                    },
                    hLineColor: function(i, node) {
                      if (i === 1 || i === 0) {
                        return '#bfdde8';
                      }
                      return '#eaeaea';
                    },
                    vLineColor: function(i, node) {
                      return '#eaeaea';
                    },
                    hLineStyle: function(i, node) {
                      // if (i === 0 || i === node.table.body.length) {
                      return null;
                      //}
                    },
                    // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                    paddingLeft: function(i, node) {
                      return 10;
                    },
                    paddingRight: function(i, node) {
                      return 10;
                    },
                    paddingTop: function(i, node) {
                      return 2;
                    },
                    paddingBottom: function(i, node) {
                      return 2;
                    },
                    fillColor: function(rowIndex, node, columnIndex) {
                      return '#fff';
                    },
                  }
            };
        }
        const CreatedDoc = new DocumentFact({
            type,
            description,
            devise,
            client_name : client,
            date_creation: new Date(),
            created_by: req.user,
            articles
        })
        CreatedDoc.save()
        .then((createdDoc) => {
            const date = moment(createdDoc.date_creation).format("DD/MM/YYYY")
            const id = createdDoc._id
            if (type == "Devis") {
                const devis = {
                    content: [
                        {
                            columns: [

                                {
                                    image: 'data:image/png;base64,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EBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQP8fRCiksIpg7iUAAAAASUVORK5CYII',
                                    width: 120
                                },

                                [
                                    {
                                        text: 'Devis',
                                        color: '#333333',
                                        width: '*',
                                        fontSize: 28,
                                        bold: true,
                                        alignment: 'right',
                                        margin: [0, 0, 0, 15],
                                    },

                                    {
                                        stack: [
                                          {
                                            columns: [
                                              {
                                                text: 'Devis No.',
                                                color: '#aaaaab',
                                                bold: true,
                                                width: '*',
                                                fontSize: 12,
                                                alignment: 'right',
                                              },
                                              {
                                                text: '00001',
                                                bold: true,
                                                color: '#333333',
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: 100,
                                              },
                                            ],
                                          },
                                          {
                                            columns: [
                                              {
                                                text: 'Date',
                                                color: '#aaaaab',
                                                bold: true,
                                                width: '*',
                                                fontSize: 12,
                                                alignment: 'right',
                                              },
                                              {
                                                text: `${date}`,
                                                bold: true,
                                                color: '#333333',
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: 100,
                                              },
                                            ],
                                          },
                                          
                                        ],
                                      },

                                    // {stack:[

                                    //     {text: "Facturé à", style: 'subheader'},
                                    //     {text: "Takolor International.", style: 'societe'},
                                    //     {text: "ZI Chotrana 1 BP4 Parc", style: 'text'},
                                    //     {text: "Technologique El Ghazela Université SESAME 3rd Floor Ariana، 2088", style: 'text'},
                                    //     {text: "Telephone : 15248795", style: 'text'},
                                    //     {text: "Email : test@test.com", style: 'text'}
                                    // ], margin: [0,0,20,0]},
                                    
                                    // {stack:[
                                    //     {text: "Envoyé à", style: 'subheader'},
                                    //     {text: `${client}`, style: 'text'},
                                    //     {text: `${client_adress}, ${client_postal}`, style: 'text'},
                                    //     {text: `${client_ville}, ${client_pays}`, style: 'text'},
                                    //     {text: `Téléphone: ${client_phone}`, style: 'text'},
                                    //     {text: `Email: ${client_email}`, style: 'text'}
                                    // ], margin: [0,0,20,0] },
                                    
                                    // {stack:
                                    // [
                                    //     {columns: [
                                    //         {stack:[
                                    //             {text: "Facture n°", style: 'subheader', alignment: 'right'},
                                    //             {text: "Date", style: 'societe', alignment: 'right'},
                                    //             {text: "RIB", style: 'societe', alignment: 'right'}
                                    //         ]},
                                                
                                    //         {stack: [
                                    //             {text: "number", alignment: 'right', style: 'small'},
                                    //             {text: `${date}`, alignment: 'right', style: 'text'},
                                    //             {text: `${client_rib}`, alignment: 'right', style: 'text'}
                                    //         ]}
                                    //     ]}
                                    // ]}
                                ]
                            ] 
                        },
                        {
                            columns: [
                              {
                                text: 'Facturé à',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
                              },
                              {
                                text: 'Envoyé à',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Marouene Jarraya \n Takolor International.',
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                              },
                              {
                                text: `${client} \n ${client_email}`,
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Adresse',
                                color: '#aaaaab',
                                bold: true,
                                margin: [0, 7, 0, 3],
                              },
                              {
                                text: 'Adresse',
                                color: '#aaaaab',
                                bold: true,
                                margin: [0, 7, 0, 3],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Technologique El Ghazela Université \n SESAME 3rd Floor Ariana, 2088 \n Tunisie',
                                style: 'invoiceBillingAddress',
                              },
                              {
                                text: `${client_adress}  \n  ${client_ville}, ${client_postal} \n ${client_pays}`,
                                style: 'invoiceBillingAddress',
                              },
                            ],
                          },
                          '\n\n',
                          {
                            width: '100%',
                            alignment: 'center',
                            text: 'Devis No. 123',
                            bold: true,
                            margin: [0, 10, 0, 10],
                            fontSize: 15,
                          },
                        
                          table(article_table, ['Prestation', 'Description', `Prix (${devise})`, 'TVA (%)', `TOTAL (${devise})` ]),

                          '\n',
                          '\n\n',
                          {
                            layout: {
                              defaultBorder: false,
                              hLineWidth: function(i, node) {
                                return 1;
                              },
                              vLineWidth: function(i, node) {
                                return 1;
                              },
                              hLineColor: function(i, node) {
                                return '#eaeaea';
                              },
                              vLineColor: function(i, node) {
                                return '#eaeaea';
                              },
                              hLineStyle: function(i, node) {
                                // if (i === 0 || i === node.table.body.length) {
                                return null;
                                //}
                              },
                              // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                              paddingLeft: function(i, node) {
                                return 10;
                              },
                              paddingRight: function(i, node) {
                                return 10;
                              },
                              paddingTop: function(i, node) {
                                return 3;
                              },
                              paddingBottom: function(i, node) {
                                return 3;
                              },
                              fillColor: function(rowIndex, node, columnIndex) {
                                return '#fff';
                              },
                            },
                            table: {
                              headerRows: 1,
                              widths: ['*', 'auto'],
                              body: [
                                [
                                  {
                                    text: 'Subtotal',
                                    border: [false, true, false, true],
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                  },
                                  {
                                    border: [false, true, false, true],
                                    text: `${subtotal} ${devise}`,
                                    alignment: 'right',
                                    fillColor: '#f5f5f5',
                                    margin: [0, 5, 0, 5],
                                  },
                                ],
                                [
                                  {
                                    text: 'Total TVA',
                                    border: [false, false, false, true],
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                  },
                                  {
                                    text: `${total_tva} ${devise}`,
                                    border: [false, false, false, true],
                                    fillColor: '#f5f5f5',
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                  },
                                ],
                                [
                                  {
                                    text: 'Total',
                                    bold: true,
                                    fontSize: 20,
                                    alignment: 'right',
                                    border: [false, false, false, true],
                                    margin: [0, 5, 0, 5],
                                  },
                                  {
                                    text: `${total_facture} ${devise}`,
                                    bold: true,
                                    fontSize: 20,
                                    alignment: 'right',
                                    border: [false, false, false, true],
                                    fillColor: '#f5f5f5',
                                    margin: [0, 5, 0, 5],
                                  },
                                ],
                              ],
                            },
                            
                        },
                        '\n\n',
                        {
                          text: 'Conditions et modalités de paiement \n Le paiement est dû dans 15 jours',
                          style: 'notesText',
                        },
                        {
                            text: `Fait le ${date} \n Signature \n JARRAYA Marouene`,
                            style: 'notesTitle',
                        },

                    ],
                    styles: {
                        notesTitle: {
                            fontSize: 10,
                            bold: true,
                            
                        },
                          notesText: {
                            fontSize: 10,
                            margin: [0, 50, 0, 3],
                        },
                    },
                    defaultStyle: {
                      columnGap: 20,
                      //font: 'Quicksand',
                    },
                }
                const pdfDoc = pdfMake.createPdf(devis)
                pdfDoc.getBase64((data) => {
                    const download = Buffer.from(data.toString('utf-8'), 'base64')
                    cloudinary.uploader.upload_stream((uploadedDoc) => {
                        const Document = uploadedDoc.secure_url
                        const updates = { documentLink: Document, withLink: req.body.withLink}
                        const options = {new:true}
                        DocumentFact.findByIdAndUpdate(id, updates, options)
                        .populate("asked_by", "nom prenom email")
                        .then((updatedDoc) => {
                            if (req.body.withEmail == true){
                                const emailData = {
                                    to: client_email, 
                                    from: "yosra.sahnoun@esprit.tn",
                                    subject: "Devis",
                                    html: `
                                    <p>Vous avez demandé un devis</p>
                                    <h5>hello</h5>
                                    `,
                                    attachments: [{
                                        filename: 'file.pdf',
                                        content: new Buffer.from(download, 'utf-8'),
                                        contentType: 'application/pdf'
                                      }]
                                }
                                transporter.sendMail(emailData)
                                .then((res)=> {
                                    console.log(res)
                                }).catch((err) => {
                                    console.log(err)
                                })
                            }
                            res.json(updatedDoc)                        
                        })
                        .catch((error) => {
                            console.log(error)
                        })
                    }).end(download)
                }) 
            } else if (type == "Facture") {
                const facture = {
                    content: [
                        {
                            columns: [

                                {
                                    image: 'data:image/png;base64,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EBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQP8fRCiksIpg7iUAAAAASUVORK5CYII',
                                    width: 120
                                },

                                [
                                    {
                                        text: 'Facture',
                                        color: '#333333',
                                        width: '*',
                                        fontSize: 28,
                                        bold: true,
                                        alignment: 'right',
                                        margin: [0, 0, 0, 15],
                                    },

                                    {
                                        stack: [
                                          {
                                            columns: [
                                              {
                                                text: 'Facture No.',
                                                color: '#aaaaab',
                                                bold: true,
                                                width: '*',
                                                fontSize: 12,
                                                alignment: 'right',
                                              },
                                              {
                                                text: '00001',
                                                bold: true,
                                                color: '#333333',
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: 100,
                                              },
                                            ],
                                          },
                                          {
                                            columns: [
                                              {
                                                text: 'Date',
                                                color: '#aaaaab',
                                                bold: true,
                                                width: '*',
                                                fontSize: 12,
                                                alignment: 'right',
                                              },
                                              {
                                                text: `${date}`,
                                                bold: true,
                                                color: '#333333',
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: 100,
                                              },
                                            ],
                                          },
                                          
                                        ],
                                      },
                                ]
                            ] 
                        },
                        {
                            columns: [
                              {
                                text: 'Facturé à',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
                              },
                              {
                                text: 'Envoyé à',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Marouene Jarraya \n Takolor International.',
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                              },
                              {
                                text: `${client} \n ${client_email}`,
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Adresse',
                                color: '#aaaaab',
                                bold: true,
                                margin: [0, 7, 0, 3],
                              },
                              {
                                text: 'Adresse',
                                color: '#aaaaab',
                                bold: true,
                                margin: [0, 7, 0, 3],
                              },
                            ],
                          },
                          {
                            columns: [
                              {
                                text: 'Technologique El Ghazela Université \n SESAME 3rd Floor Ariana, 2088 \n   Tunisie',
                                style: 'invoiceBillingAddress',
                              },
                              {
                                text: `${client_adress}  \n  ${client_ville}, ${client_postal} \n  ${client_pays}`,
                                style: 'invoiceBillingAddress',
                              },
                            ],
                          },
                          '\n\n',
                          {
                            width: '100%',
                            alignment: 'center',
                            text: 'Facture No. 123',
                            bold: true,
                            margin: [0, 10, 0, 10],
                            fontSize: 15,
                          },
                        
                          table(article_table, ['Prestation', 'Description', 'Prix', 'TVA', 'TOTAL' ]),

                          '\n',
                          '\n\n',
                          {
                            layout: {
                              defaultBorder: false,
                              hLineWidth: function(i, node) {
                                return 1;
                              },
                              vLineWidth: function(i, node) {
                                return 1;
                              },
                              hLineColor: function(i, node) {
                                return '#eaeaea';
                              },
                              vLineColor: function(i, node) {
                                return '#eaeaea';
                              },
                              hLineStyle: function(i, node) {
                                // if (i === 0 || i === node.table.body.length) {
                                return null;
                                //}
                              },
                              // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                              paddingLeft: function(i, node) {
                                return 10;
                              },
                              paddingRight: function(i, node) {
                                return 10;
                              },
                              paddingTop: function(i, node) {
                                return 3;
                              },
                              paddingBottom: function(i, node) {
                                return 3;
                              },
                              fillColor: function(rowIndex, node, columnIndex) {
                                return '#fff';
                              },
                            },
                            table: {
                              headerRows: 1,
                              widths: ['*', 'auto'],
                              body: [
                                [
                                  {
                                    text: 'Subtotal',
                                    border: [false, true, false, true],
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                  },
                                  {
                                    border: [false, true, false, true],
                                    text: `${subtotal} ${devise}`,
                                    alignment: 'right',
                                    fillColor: '#f5f5f5',
                                    margin: [0, 5, 0, 5],
                                  },
                                ],
                                [
                                  {
                                    text: 'Total TVA',
                                    border: [false, false, false, true],
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                  },
                                  {
                                    text: `${total_tva} ${devise}`,
                                    border: [false, false, false, true],
                                    fillColor: '#f5f5f5',
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                  },
                                ],
                                [
                                  {
                                    text: 'Total',
                                    bold: true,
                                    fontSize: 20,
                                    alignment: 'right',
                                    border: [false, false, false, true],
                                    margin: [0, 5, 0, 5],
                                  },
                                  {
                                    text: `${total_facture} ${devise}`,
                                    bold: true,
                                    fontSize: 20,
                                    alignment: 'right',
                                    border: [false, false, false, true],
                                    fillColor: '#f5f5f5',
                                    margin: [0, 5, 0, 5],
                                  },
                                ],
                              ],
                            },
                            
                        },
                        '\n\n',
                        {
                          text: 'Conditions et modalités de paiement \n Le paiement est dû dans 15 jours',
                          style: 'notesText',
                        },
                        {
                            text: `Fait le ${date} \n Signature \n JARRAYA Marouene` ,
                            style: 'notesTitle',
                        },

                    ],
                    styles: {
                        notesTitle: {
                            fontSize: 10,
                            bold: true,
                            
                        },
                          notesText: {
                            fontSize: 10,
                            margin: [0, 50, 0, 3],
                        },
                    },
                    defaultStyle: {
                      columnGap: 20,
                      //font: 'Quicksand',
                    },
                }
                const pdfDoc = pdfMake.createPdf(facture)
                pdfDoc.getBase64((data) => {
                    const download = Buffer.from(data.toString('utf-8'), 'base64')
                    cloudinary.uploader.upload_stream((uploadedDoc) => {
                        const Document = uploadedDoc.secure_url
                        const updates = { documentLink: Document, withLink: req.body.withLink}
                        const options = {new:true}
                        DocumentFact.findByIdAndUpdate(id, updates, options)
                        .populate("asked_by", "nom prenom email")
                        .then((updatedDoc) => {
                            if (req.body.withEmail == true){
                                const emailData = {
                                    to: client_email, 
                                    from: "yosra.sahnoun@esprit.tn",
                                    subject: "Facture",
                                    html: `
                                    <p>Vous avez demandé une facture</p>
                                    <h5>hello</h5>
                                    `,
                                    attachments: [{
                                        filename: 'facture.pdf',
                                        content: new Buffer.from(download, 'utf-8'),
                                        contentType: 'application/pdf'
                                      }]
                                }
                                transporter.sendMail(emailData)
                                .then((res)=> {
                                    console.log(res)
                                }).catch((err) => {
                                    console.log(err)
                                })
                            }
                            res.json(updatedDoc)                        
                        })
                        .catch((error) => {
                            console.log(error)
                        })
                    }).end(download)
                })
            }

        })
        .catch((error)=> {
            console.log(error)
        })

    })
    .catch((error) => {
        console.log(error)
    })
}

/** delete fact document */
exports.delete_fact_document = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id)
    DocumentFact.findByIdAndDelete(id)
    .then((deletedUser) => {
        res.send(deletedUser)
    })
    .catch((error) => {
        console.log(error)
    })
}

exports.get_selected_client = (req, res) => {
    const {client_name} = req.body
    Client.find({client_name: client_name})
    .then((result) => {
        res.json(result[0])
    })
    .catch((error) => {
        console.log(error)
    })
}

exports.convert_facture = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id)
    const updates = {type: "Facture", date_creation: new Date()}
    const options = {new: true}
    DocumentFact.findByIdAndUpdate(id, updates, options)
    .then((updatedDoc) => {
        const date = moment(updatedDoc.date_creation).format('DD/MM/YYYY')
        const articles = updatedDoc.articles
        const client = updatedDoc.client_name
        const devise = updatedDoc.devise
        Client.findOne({client_name: client})
        .then((client_info) => {
            const client_adresse = client_info.adresse
            const client_email = client_info.email
            const client_ville = client_info.ville
            const client_pays = client_info.pays
            const client_postal = client_info.code_postal
            const subTotal = getArraySum(articles).tot_prix
            const tva_total = getArraySum(articles).tva_tot
            const total_facture = subTotal+tva_total
            function ArrayToObject(tab){
                let tableau = []
                let obj = {
                    border: [false, true, false, true],
                    margin: [0, 5, 0, 5],
                    fillColor: '#eaf2f5', 
                }
                for(let i=0; i<tab.length; i++){
                    obj= {...obj, text: tab[i]}
                    tableau= [...tableau,obj]
                }
                return tableau
            }
            function ArrayToObjectSecond(tab){
                let tableau = []
                let obj = {
                  border: [false, false, false, true],
                  margin: [0, 5, 0, 5],
                  
                }
                for(let i=1; i<tab.length; i++){
                    if(i!=5){
                        obj= {...obj, text: tab[i]}
                        tableau= [...tableau,obj]
                    }else{
                        obj= {...obj, text: tab[i], fillColor: '#f5f5f5'}
                        tableau= [...tableau,obj]
                    }
                }
                return tableau
            }
            function buildTableBody(data, columns) {
                var body = [];
            
                body.push(ArrayToObject(columns))  
                    data.map(element=>{
                const propertyValues = Object.values(element);
                    body.push(ArrayToObjectSecond(propertyValues))
                })
                /*    body.push([{text: dataRow, border: [false, false, false, true],
                        margin: [0, 5, 0, 5],
                        alignment: 'left'}]);*/
            
                return body;
            }
            function table(data, columns) {
                return {
                    table: {
                        headerRows: 1,
                        widths: '20%',
                        body: buildTableBody(data, columns),
                    },
                    layout: {
                        defaultBorder: false,
                        hLineWidth: function(i, node) {
                          return 1;
                        },
                        vLineWidth: function(i, node) {
                          return 1;
                        },
                        hLineColor: function(i, node) {
                          if (i === 1 || i === 0) {
                            return '#bfdde8';
                          }
                          return '#eaeaea';
                        },
                        vLineColor: function(i, node) {
                          return '#eaeaea';
                        },
                        hLineStyle: function(i, node) {
                          // if (i === 0 || i === node.table.body.length) {
                          return null;
                          //}
                        },
                        // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                        paddingLeft: function(i, node) {
                          return 10;
                        },
                        paddingRight: function(i, node) {
                          return 10;
                        },
                        paddingTop: function(i, node) {
                          return 2;
                        },
                        paddingBottom: function(i, node) {
                          return 2;
                        },
                        fillColor: function(rowIndex, node, columnIndex) {
                          return '#fff';
                        },
                      }
                };
            }
            const facture = {
                content: [
                    {
                        columns: [

                            {
                                image: 'data:image/png;base64,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EBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQAh3AAABIdwBAASEcAcAEBDCHQBAQP8fRCiksIpg7iUAAAAASUVORK5CYII',
                                width: 120
                            },

                            [
                                {
                                    text: 'Facture',
                                    color: '#333333',
                                    width: '*',
                                    fontSize: 28,
                                    bold: true,
                                    alignment: 'right',
                                    margin: [0, 0, 0, 15],
                                },

                                {
                                    stack: [
                                      {
                                        columns: [
                                          {
                                            text: 'Facture No.',
                                            color: '#aaaaab',
                                            bold: true,
                                            width: '*',
                                            fontSize: 12,
                                            alignment: 'right',
                                          },
                                          {
                                            text: '00001',
                                            bold: true,
                                            color: '#333333',
                                            fontSize: 12,
                                            alignment: 'right',
                                            width: 100,
                                          },
                                        ],
                                      },
                                      {
                                        columns: [
                                          {
                                            text: 'Date',
                                            color: '#aaaaab',
                                            bold: true,
                                            width: '*',
                                            fontSize: 12,
                                            alignment: 'right',
                                          },
                                          {
                                            text: `${date}`,
                                            bold: true,
                                            color: '#333333',
                                            fontSize: 12,
                                            alignment: 'right',
                                            width: 100,
                                          },
                                        ],
                                      },
                                      
                                    ],
                                  },
                            ]
                        ] 
                    },
                    {
                        columns: [
                          {
                            text: 'Facturé à',
                            color: '#aaaaab',
                            bold: true,
                            fontSize: 14,
                            alignment: 'left',
                            margin: [0, 20, 0, 5],
                          },
                          {
                            text: 'Envoyé à',
                            color: '#aaaaab',
                            bold: true,
                            fontSize: 14,
                            alignment: 'left',
                            margin: [0, 20, 0, 5],
                          },
                        ],
                      },
                      {
                        columns: [
                          {
                            text: 'Marouene Jarraya \n Takolor International.',
                            bold: true,
                            color: '#333333',
                            alignment: 'left',
                          },
                          {
                            text: `${client} \n ${client_email}`,
                            bold: true,
                            color: '#333333',
                            alignment: 'left',
                          },
                        ],
                      },
                      {
                        columns: [
                          {
                            text: 'Adresse',
                            color: '#aaaaab',
                            bold: true,
                            margin: [0, 7, 0, 3],
                          },
                          {
                            text: 'Adresse',
                            color: '#aaaaab',
                            bold: true,
                            margin: [0, 7, 0, 3],
                          },
                        ],
                      },
                      {
                        columns: [
                          {
                            text: 'Technologique El Ghazela Université \n SESAME 3rd Floor Ariana, 2088 \n   Tunisie',
                            style: 'invoiceBillingAddress',
                          },
                          {
                            text: `${client_adresse}  \n  ${client_ville}, ${client_postal} \n  ${client_pays}`,
                            style: 'invoiceBillingAddress',
                          },
                        ],
                      },
                      '\n\n',
                      {
                        width: '100%',
                        alignment: 'center',
                        text: 'Facture No. 123',
                        bold: true,
                        margin: [0, 10, 0, 10],
                        fontSize: 15,
                      },
                    
                      table(articles, ['Prestation', 'Description', 'Prix', 'TVA', 'TOTAL' ]),

                      '\n',
                      '\n\n',
                      {
                        layout: {
                          defaultBorder: false,
                          hLineWidth: function(i, node) {
                            return 1;
                          },
                          vLineWidth: function(i, node) {
                            return 1;
                          },
                          hLineColor: function(i, node) {
                            return '#eaeaea';
                          },
                          vLineColor: function(i, node) {
                            return '#eaeaea';
                          },
                          hLineStyle: function(i, node) {
                            // if (i === 0 || i === node.table.body.length) {
                            return null;
                            //}
                          },
                          // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                          paddingLeft: function(i, node) {
                            return 10;
                          },
                          paddingRight: function(i, node) {
                            return 10;
                          },
                          paddingTop: function(i, node) {
                            return 3;
                          },
                          paddingBottom: function(i, node) {
                            return 3;
                          },
                          fillColor: function(rowIndex, node, columnIndex) {
                            return '#fff';
                          },
                        },
                        table: {
                          headerRows: 1,
                          widths: ['*', 'auto'],
                          body: [
                            [
                              {
                                text: 'Subtotal',
                                border: [false, true, false, true],
                                alignment: 'right',
                                margin: [0, 5, 0, 5],
                              },
                              {
                                border: [false, true, false, true],
                                text: `${subTotal} ${devise}`,
                                alignment: 'right',
                                fillColor: '#f5f5f5',
                                margin: [0, 5, 0, 5],
                              },
                            ],
                            [
                              {
                                text: 'Total TVA',
                                border: [false, false, false, true],
                                alignment: 'right',
                                margin: [0, 5, 0, 5],
                              },
                              {
                                text: `${tva_total} ${devise}`,
                                border: [false, false, false, true],
                                fillColor: '#f5f5f5',
                                alignment: 'right',
                                margin: [0, 5, 0, 5],
                              },
                            ],
                            [
                              {
                                text: 'Total',
                                bold: true,
                                fontSize: 20,
                                alignment: 'right',
                                border: [false, false, false, true],
                                margin: [0, 5, 0, 5],
                              },
                              {
                                text: `${total_facture} ${devise}`,
                                bold: true,
                                fontSize: 20,
                                alignment: 'right',
                                border: [false, false, false, true],
                                fillColor: '#f5f5f5',
                                margin: [0, 5, 0, 5],
                              },
                            ],
                          ],
                        },
                        
                    },
                    '\n\n',
                    {
                      text: 'Conditions et modalités de paiement \n Le paiement est dû dans 15 jours',
                      style: 'notesText',
                    },
                    {
                        text: `Fait le ${date} \n Signature \n JARRAYA Marouene`,
                        style: 'notesTitle',
                    },

                ],
                styles: {
                    notesTitle: {
                        fontSize: 10,
                        bold: true,
                        
                    },
                      notesText: {
                        fontSize: 10,
                        margin: [0, 50, 0, 3],
                    },
                },
                defaultStyle: {
                  columnGap: 20,
                  //font: 'Quicksand',
                },
            }
            const pdfDoc = pdfMake.createPdf(facture)
            pdfDoc.getBase64((data) => {
                const download = Buffer.from(data.toString('utf-8'), 'base64')
                cloudinary.uploader.upload_stream((uploadedDoc) => {
                    const Document = uploadedDoc.secure_url
                    const updatesNew = { documentLink: Document, withLink: req.body.withLink}
                    DocumentFact.findByIdAndUpdate(id, updatesNew, options)
                    .then((updatedDoc) => {
                        if (req.body.withEmail == true){
                            const emailData = {
                                to: client_email, 
                                from: "yosra.sahnoun@esprit.tn",
                                subject: "Facture",
                                html: `
                                <p>Vous avez demandé une facture</p>
                                <h5>hello</h5>
                                `,
                                attachments: [{
                                    filename: 'facture.pdf',
                                    content: new Buffer.from(download, 'utf-8'),
                                    contentType: 'application/pdf'
                                  }]
                            }
                            transporter.sendMail(emailData)
                            .then((res)=> {
                                console.log(res)
                            }).catch((err) => {
                                console.log(err)
                            })
                        }
                        res.json(updatedDoc)                        
                    })
                    .catch((error) => {
                        console.log(error)
                    })
                }).end(download)
            })
        })
        .catch((error) => {
            console.log("error getting the client", error)
        })
    })
    .catch((error) => {
        console.log(error)
    })
}

function getArraySum(a){
    var tot_prix =0
    var sum=0;
    var tva_tot=0
    for(var i in a) { 
        sum += a[i].total;
        tot_prix += a[i].prix;
        tva_tot += a[i].tva*a[i].prix
    }
    return {sum,tot_prix,tva_tot:tva_tot/100};
  }
