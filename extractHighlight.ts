import { TFile } from 'obsidian';


const SUPPORTED_ANNOTS = ['Text', 'Highlight', 'Underline'];


// return text between min and max, x and y
function searchQuad(minx : number, maxx : number, miny : number, maxy : number, items : any) {
    const mycontent = items.reduce(function (txt : string, x : any) {
      if (x.width == 0) return txt                      // eliminate empty stuff
      if (!((miny <= x.transform[5]) && (x.transform[5] <= maxy))) return txt  // y coordinate not in box
      if (x.transform[4] + x.width < minx) return txt   // end of txt before highlight starts
      if (x.transform[4] > maxx) return txt             // start of text after highlight ends 
  
      const start = (x.transform[4] >= minx ? 0 :       // start at pos 0, when text starts after hightlight start
        Math.floor(x.str.length * (minx - x.transform[4]) / x.width))  // otherwise, rule of three: start proportional
      if (x.transform[4] + x.width <= maxx) {           // end of txt ends before highlight ends
        return txt + x.str.substr(start)                //     
      } else {                                          // else, calculate proporation end to get the expected length
        const lenc = Math.floor(x.str.length * (maxx - x.transform[4]) / x.width) - start
        return txt + x.str.substr(start, lenc)
      }}, '')
    return mycontent.trim()
  }
  
  
  // iterate over all QuadPoints and join retrieved lines 
  export function extractHighlight(annot : any, items: any) {
    const highlight = annot.quadPoints.reduce((txt : string, quad : any) => {
      const minx = quad.reduce((prev : number, curr : any) => Math.min(prev, curr.x), quad[0].x)
      const maxx = quad.reduce((prev : number, curr : any) => Math.max(prev, curr.x), quad[0].x)
      const miny = quad.reduce((prev : number, curr : any) => Math.min(prev, curr.y), quad[0].y)
      const maxy = quad.reduce((prev : number, curr : any) => Math.max(prev, curr.y), quad[0].y)
      const res = searchQuad(minx, maxx, miny, maxy, items)
	  if (txt.substring(txt.length - 1) != '-') {
			return txt + ' ' + res    // concatenate lines by 'blank' 
	  } else if (txt.substring(txt.length - 2).toLowerCase() == txt.substring(txt.length - 2) &&  // end by lowercase-
			     res.substring(0,1).toLowerCase() == res.substring(0,1)) {						 // and start with lowercase
			return txt.substring(0,txt.length - 1) + res	// remove hyphon
	  } else {
			return txt + res							// keep hyphon 
 	  }
    }, '');
    return highlight
  }


	// load the PDFpage, then get all Annotations
	// we look only at SUPPORTED_ANNOTS (Text, Underline, Highlight)
	// if its a underline or highlight, extract Highlight of the Annotation 
  // accumulate all annotations in the array total
	async function loadPage(page, pagenum : number, file: TFile, containingFolder : string, total : Object[]) {
		let annotations = await page.getAnnotations()
		// console.log('Annotations', annotations)

		annotations = annotations.filter(function (anno) {
			return SUPPORTED_ANNOTS.indexOf(anno.subtype) >= 0;
		});

		const content : TextContent = await page.getTextContent({ normalizeWhitespace: true })

		// sort text elements
		content.items.sort(function (a1, a2) {							
			if (a1.transform[5] > a2.transform[5]) return -1    // y coord. descending
			if (a1.transform[5] < a2.transform[5]) return 1
			if (a1.transform[4] > a2.transform[4]) return 1    // x coord. ascending
			if (a1.transform[4] < a2.transform[4]) return -1				
			return 0
		})


		annotations.map(async function (anno) {
			if (anno.subtype == 'Highlight' || anno.subtype == 'Underline') {
				anno.highlightedText = extractHighlight(anno, content.items)
			}
			anno.folder = containingFolder
			anno.file = file
			anno.filepath = file.path		// we need a direct string property in the templates 
			anno.pageNumber = pagenum
			anno.author = anno.titleObj.str
      anno.body = anno.contentsObj.str
			total.push(anno)
		});
	}


  export async function loadPDFFile(file : TFile, pdfjsLib, containingFolder : string, total : Object[]) {
		const content = await this.app.vault.readBinary(file)
		const pdf : PDFDocumentProxy = await pdfjsLib.getDocument(content).promise
		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i)
			await loadPage(page, i, file, containingFolder, total)
		}
	}