      if (webhookSuccess && proposalResponse) {
        // Check the content type to determine if it's a PDF or JSON
        const contentType = proposalResponse.headers.get('content-type') || '';
        
          if (contentType.includes('application/pdf')) {
            // Stream PDF back to client directly, without saving to disk
            const arrayBuffer = await proposalResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            // Determine filename from content-disposition header or fallback
            const contentDispositionHeader = proposalResponse.headers.get('content-disposition');
            const disposition = contentDispositionHeader || 'attachment; filename="proposal.pdf"';
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': disposition,
              },
            });
          } else if (contentType.includes('application/json')) {
          // It's JSON data
          const responseData = await proposalResponse.json();
          console.log('Webhook JSON response:', responseData);
          
          // Check if the response contains file data
          if (responseData.fileData) {
            fileData = responseData.fileData;
          }
